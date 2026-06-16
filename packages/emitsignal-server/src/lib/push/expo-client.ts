import pLimit from 'p-limit';

import type { PushJob } from './types';

const EXPO_PUSH_BATCH_SIZE = 100;
const EXPO_PUSH_CONCURRENCY = 6;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_BODY_LENGTH = 160;

interface ExpoPushMessage {
    body: string;
    categoryId: string | undefined;
    data: {
        actions: string | undefined;
        messageId: string;
        topicId: string;
        topicName: string;
    };
    priority: 'high' | 'normal';
    title: string;
    to: string;
}

export function buildExpoMessages(tokens: string[], job: PushJob): ExpoPushMessage[] {
    const truncatedBody =
        job.body.length > MAX_BODY_LENGTH ? `${job.body.slice(0, MAX_BODY_LENGTH - 1)}…` : job.body;

    const hasActions = job.actions && job.actions.length > 0;

    return tokens.map((token) => ({
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
}

export async function sendExpoMessages(messages: ExpoPushMessage[]): Promise<void> {
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
