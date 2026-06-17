import { describe, expect, it, mock } from 'bun:test';

import { fileStorageMock, prismaMock } from '../../__tests__/mocks';

mock.module('../prisma', () => ({ prisma: prismaMock }));
mock.module('../storage', () => ({ FileStorageService: fileStorageMock }));

import { resetUserPlansForTests, setUserPlanForTests } from '../billing/get-user-plan';
import { PlanLimitError, PLANS } from '../billing/plans';
import {
    getOrCreateTopic,
    parseActions,
    parseTags,
    serializeMessage,
    serializeTags,
    TOPIC_NAME_REGEX,
} from '../topic';

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

describe('getOrCreateTopic — owned topic cap', () => {
    it('throws PlanLimitError when the owner is at the plan topic limit', async () => {
        resetUserPlansForTests();
        setUserPlanForTests('owner-1', 'free');
        prismaMock.topic.findUnique.mockResolvedValueOnce(null);
        prismaMock.topic.count.mockResolvedValueOnce(PLANS.free.limits.maxOwnedTopics);

        expect(getOrCreateTopic('capped-topic-1', 'owner-1')).rejects.toThrow(PlanLimitError);
    });

    it('creates the topic when the owner is under the limit', async () => {
        resetUserPlansForTests();
        setUserPlanForTests('owner-1', 'free');
        prismaMock.topic.findUnique.mockResolvedValueOnce(null);
        prismaMock.topic.count.mockResolvedValueOnce(0);

        const topic = await getOrCreateTopic('uncapped-topic-1', 'owner-1');

        expect(topic).toHaveProperty('id');
    });

    it('does not check the cap for unowned topics', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce(null);
        prismaMock.topic.count.mockClear();

        await getOrCreateTopic('anonymous-topic-1');

        expect(prismaMock.topic.count).not.toHaveBeenCalled();
    });

    it('does not check the cap for existing topics', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            createdAt: new Date(),
            description: '',
            displayName: 'existing',
            id: 'topic-existing',
            isPublic: true,
            name: 'existing-topic-1',
        });
        prismaMock.topic.count.mockClear();

        const topic = await getOrCreateTopic('existing-topic-1', 'owner-1');

        expect(topic.id).toBe('topic-existing');
        expect(prismaMock.topic.count).not.toHaveBeenCalled();
    });
});

describe('parseActions', () => {
    it('parses valid JSON array of actions', () => {
        const raw = JSON.stringify([{ type: 'acknowledge' }]);
        expect(parseActions(raw)).toEqual([{ type: 'acknowledge' }]);
    });

    it('filters out non-action types', () => {
        const raw = JSON.stringify([
            { type: 'acknowledge' },
            { type: 'invalid' },
            { type: 'view' },
        ]);
        const result = parseActions(raw);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ type: 'acknowledge' });
        expect(result[1]).toEqual({ type: 'view' });
    });

    it('returns empty array for invalid JSON', () => {
        expect(parseActions('not-json')).toEqual([]);
    });

    it('returns empty array for empty string', () => {
        expect(parseActions('')).toEqual([]);
    });

    it('returns empty array for non-array JSON', () => {
        expect(parseActions('{"foo":"bar"}')).toEqual([]);
    });
});

describe('parseTags', () => {
    it('parses valid JSON array of tags', () => {
        expect(parseTags(JSON.stringify(['urgent', 'news']))).toEqual(['urgent', 'news']);
    });

    it('returns empty array for invalid JSON', () => {
        expect(parseTags('not-json')).toEqual([]);
    });

    it('returns empty array for empty string', () => {
        expect(parseTags('')).toEqual([]);
    });
});

describe('serializeTags', () => {
    it('serializes a tags array', () => {
        expect(serializeTags(['a', 'b'])).toBe('["a","b"]');
    });

    it('returns "[]" for undefined', () => {
        expect(serializeTags(undefined)).toBe('[]');
    });

    it('returns "[]" for null', () => {
        expect(serializeTags(null as unknown as undefined)).toBe('[]');
    });
});

describe('serializeMessage', () => {
    const dbMessage = {
        actions: JSON.stringify([{ type: 'acknowledge' }]),
        body: 'Hello',
        createdAt: new Date(1000000000000),
        id: 'msg-1',
        priority: 3,
        tags: JSON.stringify(['test']),
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
            tags: '[]',
            title: '',
            topicId: 't1',
        });
        expect(result.acknowledgmentCount).toBe(0);
        expect(result.attachments).toEqual([]);
    });
});
