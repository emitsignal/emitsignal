import Elysia, { t } from 'elysia';

import { prisma } from '../../lib/prisma';
import { resolveUserId } from '../auth/plugin';

export const listSubscriptions = new Elysia({ prefix: '/subscriptions' }).get(
    '/',
    async ({ headers, query }) => {
        const userId = await resolveUserId({ headers });

        const rows = await (async () => {
            if (userId) {
                const all = await prisma.subscription.findMany({
                    include: { topic: true },
                    orderBy: { createdAt: 'desc' },
                    where: { userId },
                });

                // Deduplicate by topic; prefer the current device's row for pushEnabled
                const seen = new Map<string, (typeof all)[0]>();
                for (const sub of all) {
                    if (!seen.has(sub.topicId) || sub.deviceId === query.deviceId) {
                        seen.set(sub.topicId, sub);
                    }
                }
                return Array.from(seen.values());
            }

            if (query.deviceId) {
                return prisma.subscription.findMany({
                    include: { topic: true },
                    orderBy: { createdAt: 'desc' },
                    where: { deviceId: query.deviceId },
                });
            }

            return [];
        })();

        return rows.map((subscription) => ({
            createdAt: subscription.createdAt.getTime(),
            id: subscription.id,
            pushEnabled: subscription.pushEnabled,
            topic: {
                description: subscription.topic.description,
                displayName: subscription.topic.displayName,
                id: subscription.topic.id,
                isPublic: subscription.topic.isPublic,
                name: subscription.topic.name,
            },
        }));
    },
    {
        query: t.Object({ deviceId: t.Optional(t.String({ minLength: 1 })) }),
    },
);
