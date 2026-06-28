import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

import type { PushJob } from './types';

import { environment } from '../../schema/environment';

const MAX_BODY_LENGTH = 160;

const expo = new Expo({
    accessToken: environment.EXPO_ACCESS_TOKEN,
    maxConcurrentRequests: 6,
});

export function buildExpoMessages(tokens: string[], job: PushJob): ExpoPushMessage[] {
    const truncatedBody =
        job.body.length > MAX_BODY_LENGTH ? `${job.body.slice(0, MAX_BODY_LENGTH - 1)}…` : job.body;

    const hasActions = job.actions && job.actions.length > 0;

    return tokens
        .filter((token) => Expo.isExpoPushToken(token))
        .map((token) => ({
            body: truncatedBody,
            categoryId: hasActions ? 'emitsignal-message' : undefined,
            data: {
                actions: hasActions ? JSON.stringify(job.actions) : undefined,
                messageId: job.messageId,
                topicId: job.topicId,
                topicName: job.topicName,
            },
            priority: job.priority >= 4 ? 'high' : 'normal',
            subtitle: job.title,
            title: job.topicDisplayName,
            to: token,
        }));
}

export async function sendExpoMessages(messages: ExpoPushMessage[]): Promise<void> {
    const chunks = expo.chunkPushNotifications(messages);

    await Promise.all(chunks.map((chunk) => expo.sendPushNotificationsAsync(chunk)));
}
