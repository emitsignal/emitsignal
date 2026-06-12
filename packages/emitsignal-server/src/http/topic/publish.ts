import Elysia, { t } from 'elysia';

import { authAwareBeforeHandle } from '../../http/plugins/rate-limit-plugin';
import { validateActions } from '../../lib/actions';
import { getUserLimits } from '../../lib/billing/get-user-plan';
import { PlanLimitError } from '../../lib/billing/plans';
import { consumeDailyQuota, quotaExceededHeaders } from '../../lib/billing/usage';
import { duration } from '../../lib/duration';
import { bus } from '../../lib/event-bus';
import { parsePublishHeaders } from '../../lib/header-publish';
import { prisma } from '../../lib/prisma';
import { pushQueue, scheduleQueue } from '../../lib/queue';
import { publishAnonLimiter, publishAuthLimiter } from '../../lib/rate-limit';
import { getOrCreateTopic, serializeMessage, serializeTags } from '../../lib/topic';
import { resolveUserId } from '../auth/plugin';

const MAX_SCHEDULE_SECONDS = duration.years(1).as('seconds');

export const publish = new Elysia().post(
    '/topic/:name',
    async ({ body, headers, params, set, status }) => {
        const now = Math.floor(Date.now() / 1000);

        const scheduledAtUnix = body.scheduledAt;
        const isScheduled = scheduledAtUnix !== undefined && scheduledAtUnix > now;

        if (isScheduled && scheduledAtUnix - now > MAX_SCHEDULE_SECONDS) {
            return { error: 'scheduledAt cannot be more than 1 year in the future', status: 400 };
        }

        // Anonymous publishers are only throttled by the per-IP rate limiter;
        // daily plan quotas apply to authenticated users.
        const userId = await resolveUserId({ headers });

        if (userId) {
            const limits = await getUserLimits(userId);
            const quota = await consumeDailyQuota(userId, 'messages', limits.messagesPerDay);

            if (!quota.allowed) {
                Object.assign(set.headers, quotaExceededHeaders(quota));

                return status(429, {
                    error: 'daily_quota_exceeded',
                    limit: quota.limit,
                    metric: 'messages',
                    resetAt: quota.resetAt,
                });
            }
        }

        let topic;

        try {
            topic = await getOrCreateTopic(params.name, userId ?? undefined);
        } catch (error) {
            if (error instanceof PlanLimitError) {
                return status(403, {
                    error: 'plan_limit_reached',
                    limit: error.limit,
                    metric: error.metric,
                    plan: error.plan,
                });
            }

            throw error;
        }

        const validation = validateActions(body.actions);

        if ('error' in validation) {
            return { error: validation.error, status: 400 };
        }

        const actions = validation.actions;

        const message = await prisma.message.create({
            data: {
                actions: JSON.stringify(actions),
                body: body.body,
                priority: body.priority,
                scheduledAt: isScheduled ? new Date(scheduledAtUnix * 1000) : null,
                tags: serializeTags(body.tags),
                title: body.title,
                topicId: topic.id,
            },
        });

        if (isScheduled) {
            scheduleQueue.add(
                'schedule-delivery',
                { messageId: message.id },
                { delay: (scheduledAtUnix - now) * 1000 },
            );

            return { message: 'scheduled', messageId: message.id, scheduledAt: scheduledAtUnix };
        }

        const event = await serializeMessage({ ...message, topicId: topic.id }, 0, false);

        bus.publish(topic.name, { ...event, topicName: topic.name });

        pushQueue.add('push-message', {
            actions,
            body: body.body,
            messageId: message.id,
            priority: message.priority,
            title: body.title,
            topicDisplayName: topic.displayName,
            topicId: topic.id,
            topicName: topic.name,
        });

        return { message: 'posted', messageId: message.id };
    },
    {
        beforeHandle: authAwareBeforeHandle(publishAnonLimiter, publishAuthLimiter),
        body: t.Object({
            actions: t.Optional(
                t.Array(
                    t.Object({
                        label: t.Optional(t.String()),
                        type: t.Union([t.Literal('acknowledge'), t.Literal('view')]),
                        url: t.Optional(t.String()),
                    }),
                    { maxItems: 2 },
                ),
            ),
            body: t.String(),
            priority: t.Integer({ maximum: 5, minimum: 1 }),
            scheduledAt: t.Optional(t.Integer()),
            tags: t.Array(t.String()),
            title: t.String(),
        }),
        parse: [
            async ({ contentType, request }) => {
                if (!contentType?.includes('application/json')) {
                    const rawBody = await request.text();

                    return parsePublishHeaders(Object.fromEntries(request.headers), rawBody);
                }
            },
        ],
    },
);
