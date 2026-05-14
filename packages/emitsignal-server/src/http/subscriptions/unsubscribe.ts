import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';

export const unsubscribe = new Elysia({ prefix: '/subscriptions' }).delete(
    '/',
    async ({ body }) => {
        const topic = await prisma.topic.findUnique({
            where: { name: body.topicName },
        });

        if (!topic) {
            return { ok: true };
        }

        await prisma.subscription
            .delete({
                where: {
                    deviceId_topicId: {
                        deviceId: body.deviceId,
                        topicId: topic.id,
                    },
                },
            })
            .catch(() => null);

        return { ok: true };
    },
    {
        body: t.Object({
            deviceId: t.String({ minLength: 1 }),
            topicName: t.String({ minLength: 1 }),
        }),
    },
);
