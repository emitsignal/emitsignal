import { Subscription, Topic } from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { resolveUserId } from '../auth/plugin';

export async function resolveSubscriptions({
    deviceId,
    headers,
}: {
    deviceId?: string;
    headers: Record<string, string | undefined>;
}) {
    const userId = await resolveUserId({ headers });

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
