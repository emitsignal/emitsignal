import Elysia, { t } from 'elysia';

import { PlanLimitError } from '../../lib/billing/plans';
import { prisma } from '../../lib/prisma';
import { serializeSubscriptionSettings } from '../../lib/subscription-settings';
import { getOrCreateTopic, TOPIC_NAME_MAX_LENGTH, TopicNameError } from '../../lib/topic';
import { resolveUserId } from '../auth/plugin';

export const subscribe = new Elysia({ prefix: '/subscriptions' }).post(
    '/',
    async ({ body, headers, status }) => {
        const userId = await resolveUserId({ headers });

        let topic;

        try {
            topic = await getOrCreateTopic(body.topicName, userId ?? undefined);
        } catch (error) {
            if (error instanceof TopicNameError) {
                return status(400, {
                    error: 'invalid_topic_name',
                    message: error.message,
                });
            }

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

        const settings = serializeSubscriptionSettings(body.settings ?? {});

        const subscription = await prisma.subscription.upsert({
            create: {
                deviceId: body.deviceId,
                pushEnabled: body.pushEnabled ?? true,
                settings,
                topicId: topic.id,
                userId,
            },
            update: {
                pushEnabled: body.pushEnabled ?? true,
                settings,
                userId,
            },
            where: {
                deviceId_topicId: {
                    deviceId: body.deviceId,
                    topicId: topic.id,
                },
            },
        });

        return {
            id: subscription.id,
            topic: {
                description: topic.description,
                displayName: topic.displayName,
                id: topic.id,
                name: topic.name,
            },
        };
    },
    {
        body: t.Object({
            deviceId: t.String({ minLength: 1 }),
            pushEnabled: t.Optional(t.Boolean()),
            settings: t.Optional(
                t.Object({
                    listenSince: t.Optional(
                        t.Union([t.Literal('always'), t.Literal('subscription_date')]),
                    ),
                }),
            ),
            topicName: t.String({ maxLength: TOPIC_NAME_MAX_LENGTH, minLength: 1 }),
        }),
    },
);
