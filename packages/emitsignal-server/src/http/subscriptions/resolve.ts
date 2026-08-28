import { Subscription, Topic } from '#/generated/prisma/client';
import { prisma } from '#/lib/prisma';

export async function resolveSubscriptions({
    deviceId,
    userId,
}: {
    deviceId?: string;
    userId: null | string;
}) {
    if (userId) {
        const subscriptions = await prisma.subscription.findMany({
            include: { topic: true },
            orderBy: { topic: { name: 'asc' } },
            where: { userId },
        });

        const seen = new Map<string, { topic: Topic } & Subscription>();

        for (const subscription of subscriptions) {
            if (!seen.has(subscription.topicId) || subscription.deviceId === deviceId) {
                seen.set(subscription.topicId, subscription);
            }
        }

        return { rows: Array.from(seen.values()), userId };
    }

    if (deviceId) {
        const rows = await prisma.subscription.findMany({
            include: { topic: true },
            orderBy: { topic: { name: 'asc' } },
            where: { deviceId, userId: null },
        });

        return { rows, userId: null };
    }

    return { rows: [], userId: null };
}
