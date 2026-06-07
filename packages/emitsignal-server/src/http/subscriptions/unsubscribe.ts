import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';
import { resolveUserId } from '../auth/plugin';

export const unsubscribe = new Elysia({ prefix: '/subscriptions' }).delete(
    '/',
    async ({ body, headers }) => {
        const userId = await resolveUserId({ headers });

        const topic = await prisma.topic.findUnique({
            where: { name: body.topicName },
        });

        if (!topic) {
            return { ok: true };
        }

        if (userId) {
            // Remove across all devices for this user
            await prisma.subscription
                .deleteMany({
                    where: { topicId: topic.id, userId },
                })
                .catch(() => null);
        } else {
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
        }

        return { ok: true };
    },
    {
        body: t.Object({
            deviceId: t.String({ minLength: 1 }),
            topicName: t.String({ minLength: 1 }),
        }),
    },
);
