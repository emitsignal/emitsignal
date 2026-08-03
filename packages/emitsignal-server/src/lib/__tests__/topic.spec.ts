import { describe, expect, it, mock } from 'bun:test';

import { fileStorageMock, prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/storage', () => ({ FileStorageService: fileStorageMock }));

import { serializeMessage } from '#/services/message';
import {
    getOrCreateTopic,
    isValidTopicName,
    TOPIC_NAME_MAX_LENGTH,
    TOPIC_NAME_REGEX,
} from '#/services/topic';

describe('TOPIC_NAME_REGEX', () => {
    const validNames = ['my-topic', 'a/b_c', 'a1', 'UPPER', 'CamelCase', 'test-ns/my-topic', 'abc'];

    validNames.forEach((name) => {
        it(`accepts "${name}"`, () => {
            expect(TOPIC_NAME_REGEX.test(name)).toBe(true);
        });
    });

    const invalidNames = ['', '-start', 'trailing-', 'has space', '/slash-start'];

    invalidNames.forEach((name) => {
        it(`rejects "${name}"`, () => {
            expect(TOPIC_NAME_REGEX.test(name)).toBe(false);
        });
    });
});

describe('isValidTopicName', () => {
    it('accepts a well-formed name within the length limit', () => {
        expect(isValidTopicName('acme/infra-deploys')).toBe(true);
    });

    it('accepts a name exactly at the max length', () => {
        const name = 'a'.repeat(TOPIC_NAME_MAX_LENGTH);
        expect(name.length).toBe(TOPIC_NAME_MAX_LENGTH);
        expect(isValidTopicName(name)).toBe(true);
    });

    it('rejects a name one character over the max length', () => {
        const name = 'a'.repeat(TOPIC_NAME_MAX_LENGTH + 1);
        expect(isValidTopicName(name)).toBe(false);
    });

    it('rejects a name with invalid characters', () => {
        expect(isValidTopicName('has space')).toBe(false);
    });

    it('rejects an empty name', () => {
        expect(isValidTopicName('')).toBe(false);
    });
});

describe('getOrCreateTopic', () => {
    it('creates an ownerless, public topic for a new name', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce(null);
        prismaMock.topic.count.mockClear();

        await getOrCreateTopic('brand-new-topic-1');

        const createCall = prismaMock.topic.create.mock.calls[
            prismaMock.topic.create.mock.calls.length - 1
        ] as unknown as [{ data: Record<string, unknown> }];

        expect(createCall[0].data).not.toHaveProperty('ownerId');
        expect(createCall[0].data).toHaveProperty('accessMode', 'public');
        // Ownership is never assigned implicitly, so the plan cap is never checked here.
        expect(prismaMock.topic.count).not.toHaveBeenCalled();
    });

    it('returns an existing topic unchanged', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            accessMode: 'public',
            createdAt: new Date(),
            description: '',
            displayName: 'existing',
            id: 'topic-existing',
            name: 'existing-topic-2',
            ownerId: null,
        });

        const topic = await getOrCreateTopic('existing-topic-2');

        expect(topic.id).toBe('topic-existing');
    });

    it('rejects an invalid topic name', () => {
        expect(getOrCreateTopic('has space')).rejects.toThrow();
    });
});

describe('serializeMessage', () => {
    const dbMessage = {
        actions: JSON.stringify([{ type: 'acknowledge' }]),
        body: 'Hello',
        createdAt: new Date(1000000000000),
        id: 'msg-1',
        priority: 3,
        tags: ['test'],
        title: 'Test',
        topicId: 'topic-1',
    };

    it('converts a DB message to API format', async () => {
        const result = await serializeMessage(dbMessage, 5);

        expect(result).toEqual({
            acknowledgmentCount: 5,
            actions: [{ type: 'acknowledge' }],
            attachments: [],
            bannerImage: null,
            body: 'Hello',
            createdAt: 1000000000000,
            id: 'msg-1',
            inlineAttachments: [],
            inlineImages: [],
            priority: 3,
            tags: ['test'],
            title: 'Test',
            topicId: 'topic-1',
        });
    });

    it('includes attachments with URLs when present', async () => {
        prismaMock.attachment.findMany.mockResolvedValueOnce([
            {
                filename: 'screenshot.png',
                mimeType: 'image/png',
                size: 1024,
                storageKey: 'abc.png',
            },
        ]);

        fileStorageMock.provider.getUrl.mockResolvedValueOnce('https://example.com/abc.png');

        const result = await serializeMessage(dbMessage, 0, true);

        expect(result.attachments).toEqual([
            {
                filename: 'screenshot.png',
                mimeType: 'image/png',
                size: 1024,
                storageKey: 'abc.png',
                url: 'https://example.com/abc.png',
            },
        ]);
    });

    it('defaults acknowledgmentCount to 0', async () => {
        const result = await serializeMessage({
            actions: '[]',
            body: '',
            createdAt: new Date(0),
            id: 'msg-1',
            priority: 1,
            tags: [],
            title: '',
            topicId: 't1',
        });
        expect(result.acknowledgmentCount).toBe(0);
        expect(result.attachments).toEqual([]);
    });
});
