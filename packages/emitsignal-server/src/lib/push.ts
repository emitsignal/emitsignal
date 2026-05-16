import { prisma } from './prisma';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const MAX_BODY_LENGTH = 160;

export interface PushJob {
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
        select: { deviceId: true },
        where: { pushEnabled: true, topicId: job.topicId },
    });

    if (subscriptions.length === 0) {
        return;
    }

    const deviceIds = [...new Set(subscriptions.map(({ deviceId }) => deviceId))];

    const pushTokens = await prisma.pushToken.findMany({
        select: { token: true },
        where: { deviceId: { in: deviceIds }, pushEnabled: true },
    });

    if (pushTokens.length === 0) {
        return;
    }

    const truncatedBody =
        job.body.length > MAX_BODY_LENGTH ? `${job.body.slice(0, MAX_BODY_LENGTH - 1)}…` : job.body;

    const messages = pushTokens.map(({ token }) => ({
        body: truncatedBody,
        data: {
            messageId: job.messageId,
            topicId: job.topicId,
            topicName: job.topicName,
        },
        priority: job.priority >= 4 ? 'high' : 'normal',
        title: `${job.topicDisplayName}: ${job.title}`,
        to: token,
    }));

    const response = await fetch(EXPO_PUSH_URL, {
        body: JSON.stringify(messages),
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
    });

    if (!response.ok) {
        const text = await response.text();

        throw new Error(`Expo push API error ${response.status}: ${text}`);
    }
}
