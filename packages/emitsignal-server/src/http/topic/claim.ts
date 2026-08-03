import { isValidTopicName, PAID_PLAN_NAMES } from '@emitsignal/shared';
import Elysia, { t } from 'elysia';

import type { Topic } from '#/generated/prisma/client';

import { resolveUserId } from '#/http/auth/plugin';
import { authAwareBeforeHandle } from '#/http/plugins/rate-limit-plugin';
import { getUserPlan } from '#/lib/billing/get-user-plan';
import { PLANS } from '#/lib/billing/plans';
import { topicNameCache } from '#/lib/cache';
import { prisma } from '#/lib/prisma';
import { readAnonLimiter, readAuthLimiter } from '#/lib/rate-limit';

// Ownership is derived from Topic.ownerId, so these writes are done sequentially
// rather than in a transaction: if the owner TopicAccess row ever fails to write,
// the owner is still recognized via ownerId and the row can be re-created later.
async function claimOwnerlessTopic(accessMode: string, topicId: string, userId: string) {
    const updated = await prisma.topic.update({
        data: { accessMode, ownerId: userId },
        where: { id: topicId },
    });

    await prisma.topicAccess.upsert({
        create: { role: 'owner', topicId, userId },
        update: { role: 'owner' },
        where: { topicId_userId: { topicId, userId } },
    });

    return updated;
}

function serializeOwnedTopic(topic: Topic) {
    return {
        accessMode: topic.accessMode,
        createdAt: topic.createdAt.getTime(),
        description: topic.description,
        displayName: topic.displayName,
        id: topic.id,
        isOwner: true,
        name: topic.name,
        ownerId: topic.ownerId,
    };
}

export const claimTopic = new Elysia()
    .delete(
        '/topics/:name/claim',
        async ({ headers, params, status }) => {
            const userId = await resolveUserId({ headers });

            if (!userId) {
                return status(401, { error: 'missing_token' });
            }

            const name = params.name.toLowerCase();
            const topic = await prisma.topic.findUnique({ where: { name } });

            if (!topic) {
                return status(404, { error: 'topic_not_found' });
            }

            if (topic.ownerId !== userId) {
                return status(403, { error: 'forbidden' });
            }

            const released = await prisma.topic.update({
                data: { accessMode: 'public', ownerId: null },
                where: { id: topic.id },
            });

            await prisma.topicAccess.deleteMany({ where: { topicId: topic.id } });

            topicNameCache.delete(name);

            return {
                accessMode: released.accessMode,
                createdAt: released.createdAt.getTime(),
                description: released.description,
                displayName: released.displayName,
                id: released.id,
                isOwner: false,
                name: released.name,
                ownerId: released.ownerId,
            };
        },
        {
            params: t.Object({ name: t.String() }),
        },
    )
    .post(
        '/topics/:name/claim',
        async ({ body, headers, params, status }) => {
            const userId = await resolveUserId({ headers });

            if (!userId) {
                return status(401, { error: 'missing_token' });
            }

            const name = params.name.toLowerCase();

            if (!isValidTopicName(name)) {
                return status(400, { error: 'invalid_topic_name', message: 'invalid topic name' });
            }

            const plan = await getUserPlan(userId);

            if (!PAID_PLAN_NAMES.includes(plan)) {
                return status(403, {
                    error: 'plan_required',
                    message:
                        'Reserving a topic requires a paid plan (Pulse or Beam). Upgrade to claim ownership of a topic.',
                    requiredPlans: PAID_PLAN_NAMES,
                });
            }

            const accessMode = body.accessMode ?? 'public';
            const existing = await prisma.topic.findUnique({ where: { name } });

            if (existing?.ownerId === userId) {
                // Already yours — idempotent success, no limit re-check.
                return serializeOwnedTopic(existing);
            }

            if (existing?.ownerId) {
                return status(409, { error: 'already_claimed' });
            }

            // Acquiring a new topic — enforce the per-plan owned-topics cap.
            const limit = PLANS[plan].limits.maxOwnedTopics;
            const ownedCount = await prisma.topic.count({ where: { ownerId: userId } });

            if (ownedCount >= limit) {
                return status(403, {
                    error: 'plan_limit_reached',
                    limit,
                    metric: 'owned_topics',
                    plan,
                });
            }

            if (existing) {
                const claimed = await claimOwnerlessTopic(accessMode, existing.id, userId);

                topicNameCache.delete(name);

                return serializeOwnedTopic(claimed);
            }

            // Topic does not exist yet — reserve it (create + own).
            try {
                const created = await prisma.topic.create({
                    data: {
                        accessMode,
                        description: '',
                        displayName: name,
                        name,
                        ownerId: userId,
                    },
                });

                await prisma.topicAccess.create({
                    data: { role: 'owner', topicId: created.id, userId },
                });

                topicNameCache.delete(name);

                return serializeOwnedTopic(created);
            } catch (error) {
                // Concurrent create of the same topic (e.g. a publish auto-created it).
                if ((error as { code?: string }).code === 'P2002') {
                    const raced = await prisma.topic.findUnique({ where: { name } });

                    if (raced?.ownerId === userId) {
                        return serializeOwnedTopic(raced);
                    }

                    if (raced && !raced.ownerId) {
                        const claimed = await claimOwnerlessTopic(accessMode, raced.id, userId);

                        topicNameCache.delete(name);

                        return serializeOwnedTopic(claimed);
                    }

                    return status(409, { error: 'already_claimed' });
                }

                throw error;
            }
        },
        {
            beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
            body: t.Object({
                accessMode: t.Optional(
                    t.Union([t.Literal('public'), t.Literal('readonly'), t.Literal('private')]),
                ),
            }),
            params: t.Object({ name: t.String() }),
        },
    );
