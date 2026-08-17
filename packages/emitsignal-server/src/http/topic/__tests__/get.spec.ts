import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

import { getTopic } from '#/http/topic/get';

describe('GET /topics/:name', () => {
    const app = new Elysia().use(getTopic);

    it('returns topic with counts', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            _count: { messages: 10, subscriptions: 3 },
            accessMode: 'public',
            createdAt: new Date(1700000000000),
            description: 'desc',
            displayName: 'Test Topic',
            id: 't1',
            name: 'test-topic',
            ownerId: null,
        });

        const res = await app.handle(new Request('http://localhost/topics/test-topic'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual({
            accessMode: 'public',
            createdAt: 1700000000000,
            description: 'desc',
            displayName: 'Test Topic',
            id: 't1',
            isOwner: false,
            messageCount: 10,
            name: 'test-topic',
            ownerId: null,
            subscriberCount: 3,
        });
    });

    it('returns 404 when topic is not found', async () => {
        // prismaMock is shared across every spec file and never reset, so specs that set a
        // persistent findUnique default would otherwise decide this test's outcome.
        prismaMock.topic.findUnique.mockResolvedValueOnce(null);

        const res = await app.handle(new Request('http://localhost/topics/nonexistent'));

        expect(res.status).toBe(404);

        const data = await res.json();

        expect(data).toEqual({ error: 'topic_not_found' });
    });
});
