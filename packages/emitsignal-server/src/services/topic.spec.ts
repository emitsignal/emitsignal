import { describe, expect, it, mock } from 'bun:test';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

import {
    getOrCreateTopic,
    isValidTopicName,
    TOPIC_NAME_MAX_LENGTH,
    TOPIC_NAME_REGEX,
} from './topic';

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
