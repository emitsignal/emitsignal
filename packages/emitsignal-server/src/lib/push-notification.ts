import pLimit from 'p-limit';

import type { Action } from './actions';

import { prisma } from './prisma';

const EXPO_PUSH_BATCH_SIZE = 100;

const EXPO_PUSH_CONCURRENCY = 6;

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const MAX_BODY_LENGTH = 160;

export interface PushJob {
    actions: Action[];
    body: string;
    messageId: string;
    priority: number;
    title: string;
    topicDisplayName: string;
    topicId: string;
    topicName: string;
}

export async function sendPushNotifications(job: PushJob): Promise<void> {
    const subscriptions = await prisma.subscription.findMany({
        select: { deviceId: true, userId: true },
        where: { pushEnabled: true, topicId: job.topicId },
    });

    if (subscriptions.length === 0) {
        return;
    }

    // Prefer userId: it identifies the user precisely and lets us notify every device
    // the user owns. Subscriptions without a userId fall back to matching by deviceId.
    const userIds = [
        ...new Set(
            subscriptions
                .map(({ userId }) => userId)
                .filter((userId): userId is string => userId !== null),
        ),
    ];

    const deviceIds = [
        ...new Set(
            subscriptions.filter(({ userId }) => userId === null).map(({ deviceId }) => deviceId),
        ),
    ];

    const pushTokens = await prisma.pushToken.findMany({
        select: { token: true },
        where: {
            OR: [{ userId: { in: userIds } }, { deviceId: { in: deviceIds } }],
            pushEnabled: true,
        },
    });

    if (pushTokens.length === 0) {
        return;
    }

    const tokens = [...new Set(pushTokens.map(({ token }) => token))];

    const truncatedBody =
        job.body.length > MAX_BODY_LENGTH ? `${job.body.slice(0, MAX_BODY_LENGTH - 1)}…` : job.body;

    const hasActions = job.actions && job.actions.length > 0;

    const messages = tokens.map((token) => ({
        body: truncatedBody,
        categoryId: hasActions ? 'emitsignal-message' : undefined,
        data: {
            actions: hasActions ? JSON.stringify(job.actions) : undefined,
            messageId: job.messageId,
            topicId: job.topicId,
            topicName: job.topicName,
        },
        priority: job.priority >= 4 ? 'high' : 'normal',
        title: `${job.topicDisplayName}: ${job.title}`,
        to: token,
    }));

    const batches = [];

    for (let index = 0; index < messages.length; index += EXPO_PUSH_BATCH_SIZE) {
        batches.push(messages.slice(index, index + EXPO_PUSH_BATCH_SIZE));
    }

    const limit = pLimit(EXPO_PUSH_CONCURRENCY);

    await Promise.all(
        batches.map((batch) =>
            limit(async () => {
                const response = await fetch(EXPO_PUSH_URL, {
                    body: JSON.stringify(batch),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    method: 'POST',
                });

                if (!response.ok) {
                    const text = await response.text();

                    throw new Error(`Expo push API error ${response.status}: ${text}`);
                }
            }),
        ),
    );
}
