import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { fileStorageMock, prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));
mock.module('../../../lib/storage', () => ({ FileStorageService: fileStorageMock }));

import { messages } from '../../topic/messages';

describe('GET /topics/:name/messages', () => {
    const app = new Elysia().use(messages);

    it('returns messages for an existing topic', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            id: 't1',
            name: 'test-topic',
        });

        prismaMock.message.findMany.mockResolvedValueOnce([
            {
                _count: { acknowledgments: 2 },
                actions: '[]',
                body: 'Test body',
                createdAt: new Date(1700000000000),
                id: 'msg-1',
                priority: 3,
                scheduledAt: null,
                tags: '[]',
                title: 'Test',
                topicId: 't1',
            },
        ]);

        const res = await app.handle(new Request('http://localhost/topics/test-topic/messages'));

        expect(res.status).toBe(200);

        const body = await res.json();

        expect(body.data).toBeArray();
        expect(body.data[0]).toHaveProperty('acknowledgmentCount', 2);
        expect(body.data[0]).toHaveProperty('id', 'msg-1');
        expect(body).toHaveProperty('nextCursor', null);
    });

    it('returns 404 for non-existent topic', async () => {
        const res = await app.handle(new Request('http://localhost/topics/nonexistent/messages'));
        expect(res.status).toBe(404);

        const data = await res.json();
        expect(data).toEqual({ error: 'topic_not_found' });
    });

    it('passes limit query param', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            id: 't1',
            name: 'test-topic',
        });

        const res = await app.handle(
            new Request('http://localhost/topics/test-topic/messages?limit=10'),
        );

        expect(res.status).toBe(200);

        const callArgs = prismaMock.message.findMany.mock.calls[
            prismaMock.message.findMany.mock.calls.length - 1
        ] as unknown as [{ take: number }];

        expect(callArgs[0].take).toBe(10);
    });

    it('defaults limit to 50 when not specified', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            id: 't1',
            name: 'test-topic',
        });

        const res = await app.handle(new Request('http://localhost/topics/test-topic/messages'));

        expect(res.status).toBe(200);

        const callArgs = prismaMock.message.findMany.mock.calls[
            prismaMock.message.findMany.mock.calls.length - 1
        ] as unknown as [{ take: number }];

        expect(callArgs[0].take).toBe(50);
    });
});
