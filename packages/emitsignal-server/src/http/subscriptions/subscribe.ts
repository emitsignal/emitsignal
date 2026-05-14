import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';
import { getOrCreateTopic } from '../../lib/topic';

export const subscribe = new Elysia({ prefix: '/subscriptions' }).post(
    '/',
    async ({ body }) => {
        const topic = await getOrCreateTopic(body.topicName);

        const subscription = await prisma.subscription.upsert({
            create: {
                deviceId: body.deviceId,
                pushEnabled: body.pushEnabled ?? true,
                topicId: topic.id,
            },
            update: {
                pushEnabled: body.pushEnabled ?? true,
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
            topicName: t.String({ minLength: 1 }),
        }),
    },
);
