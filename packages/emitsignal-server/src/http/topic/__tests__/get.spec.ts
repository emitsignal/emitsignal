import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

import { getTopic } from '../../topic/get';

describe('GET /topics/:name', () => {
    const app = new Elysia().use(getTopic);

    it('returns topic with counts', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            _count: { messages: 10, subscriptions: 3 },
            createdAt: new Date(1700000000000),
            description: 'desc',
            displayName: 'Test Topic',
            id: 't1',
            isPublic: true,
            name: 'test-topic',
        });

        const res = await app.handle(new Request('http://localhost/topics/test-topic'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual({
            createdAt: 1700000000000,
            description: 'desc',
            displayName: 'Test Topic',
            id: 't1',
            isPublic: true,
            messageCount: 10,
            name: 'test-topic',
            subscriberCount: 3,
        });
    });

    it('returns 404 when topic is not found', async () => {
        const res = await app.handle(new Request('http://localhost/topics/nonexistent'));

        expect(res.status).toBe(404);

        const data = await res.json();

        expect(data).toEqual({ error: 'topic_not_found' });
    });
});
