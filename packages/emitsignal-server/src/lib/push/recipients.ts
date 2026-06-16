import { prisma } from '../prisma';

/**
 * Resolves the deduplicated push tokens that should receive a topic's message.
 *
 * Prefers userId: it identifies the user precisely and lets us notify every device
 * the user owns. Subscriptions without a userId fall back to matching by deviceId.
 */
export async function resolvePushTokens(topicId: string): Promise<string[]> {
    const subscriptions = await prisma.subscription.findMany({
        select: { deviceId: true, userId: true },
        where: { pushEnabled: true, topicId },
    });

    if (subscriptions.length === 0) {
        return [];
    }

    const deviceIds = [
        ...new Set(
            subscriptions.filter(({ userId }) => userId === null).map(({ deviceId }) => deviceId),
        ),
    ];

    const userIds = [
        ...new Set(
            subscriptions
                .map(({ userId }) => userId)
                .filter((userId): userId is string => userId !== null),
        ),
    ];

    const pushTokens = await prisma.pushToken.findMany({
        select: { token: true },
        where: {
            OR: [{ deviceId: { in: deviceIds } }, { userId: { in: userIds } }],
            pushEnabled: true,
        },
    });

    return [...new Set(pushTokens.map(({ token }) => token))];
}
