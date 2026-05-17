import { describe, expect, it } from 'bun:test';

import { parseActions, parseTags, serializeMessage, serializeTags, TOPIC_NAME_RE } from '../topic';

describe('TOPIC_NAME_RE', () => {
    const validNames = ['my-topic', 'a/b_c', 'a1', 'UPPER', 'CamelCase', 'test-ns/my-topic', 'abc'];

    validNames.forEach((name) => {
        it(`accepts "${name}"`, () => {
            expect(TOPIC_NAME_RE.test(name)).toBe(true);
        });
    });

    const invalidNames = ['', '-start', 'trailing-', 'has space', '/slash-start'];

    invalidNames.forEach((name) => {
        it(`rejects "${name}"`, () => {
            expect(TOPIC_NAME_RE.test(name)).toBe(false);
        });
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
    it('converts a DB message to API format', () => {
        const dbMessage = {
            actions: JSON.stringify([{ type: 'acknowledge' }]),
            body: 'Hello',
            createdAt: new Date(1000000000000),
            id: 'msg-1',
            priority: 3,
            scheduledAt: null,
            tags: JSON.stringify(['test']),
            title: 'Test',
            topicId: 'topic-1',
        };

        const result = serializeMessage(dbMessage, 5);

        expect(result).toEqual({
            acknowledgmentCount: 5,
            actions: [{ type: 'acknowledge' }],
            body: 'Hello',
            createdAt: 1000000000000,
            id: 'msg-1',
            priority: 3,
            tags: ['test'],
            title: 'Test',
            topicId: 'topic-1',
        });
    });

    it('defaults acknowledgmentCount to 0', () => {
        const dbMessage = {
            actions: '[]',
            body: '',
            createdAt: new Date(0),
            id: 'msg-1',
            priority: 1,
            scheduledAt: null,
            tags: '[]',
            title: '',
            topicId: 't1',
        };

        const result = serializeMessage(dbMessage);
        expect(result.acknowledgmentCount).toBe(0);
    });
});
