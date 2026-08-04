import { describe, expect, it } from 'bun:test';

import type { PushJob } from '#/services/push/types';

import { buildExpoMessages } from '#/services/push/expo-client';

const baseJob: PushJob = {
    actions: [],
    body: 'Deployment finished without errors',
    createdAt: 1_754_200_000_000,
    messageId: 'message-1',
    priority: 3,
    title: 'Deploy complete',
    topicDisplayName: 'Deploys',
    topicId: 'topic-1',
    topicName: 'deploys',
};

const validToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';

describe('buildExpoMessages', () => {
    it('drops tokens that are not Expo push tokens', () => {
        const messages = buildExpoMessages([validToken, 'not-a-token'], baseJob);

        expect(messages).toHaveLength(1);
        expect(messages[0]?.to).toBe(validToken);
    });

    it('marks every message as mutable so the iOS extension can run', () => {
        const [message] = buildExpoMessages([validToken], baseJob);

        expect(message?.mutableContent).toBe(true);
    });

    it('includes the snapshot fields the notification service extension reads', () => {
        const [message] = buildExpoMessages([validToken], baseJob);

        expect(message?.data).toMatchObject({
            createdAt: baseJob.createdAt,
            messageId: baseJob.messageId,
            priority: baseJob.priority,
            topicId: baseJob.topicId,
            topicName: baseJob.topicName,
        });
    });

    it('truncates long bodies to 160 characters', () => {
        const [message] = buildExpoMessages([validToken], {
            ...baseJob,
            body: 'a'.repeat(200),
        });

        expect(message?.body).toHaveLength(160);
        expect(message?.body?.endsWith('…')).toBe(true);
    });

    it('only sets the action category when the job has actions', () => {
        const [plain] = buildExpoMessages([validToken], baseJob);
        const [withActions] = buildExpoMessages([validToken], {
            ...baseJob,
            actions: [{ label: 'Open', type: 'view', url: 'https://example.com' }],
        });

        expect(plain?.categoryId).toBeUndefined();
        expect(withActions?.categoryId).toBe('emitsignal-message');
    });

    it('maps priority 4 and above to high delivery priority', () => {
        const [normal] = buildExpoMessages([validToken], baseJob);
        const [high] = buildExpoMessages([validToken], { ...baseJob, priority: 5 });

        expect(normal?.priority).toBe('normal');
        expect(high?.priority).toBe('high');
    });
});
