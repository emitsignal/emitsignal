import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

import { listTopics } from '../../topic/list';

describe('GET /topics', () => {
    const app = new Elysia().use(listTopics);

    it('returns all topics when no query', async () => {
        const topics = [
            {
                createdAt: new Date(1700000000000),
                description: 'desc',
                displayName: 'Test',
                id: 't1',
                isPublic: true,
                name: 'test',
            },
        ];

        prismaMock.topic.findMany.mockResolvedValueOnce(topics);

        const res = await app.handle(new Request('http://localhost/topics'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toBeArray();
        expect(data).toHaveLength(1);
        expect(data[0]).toEqual({
            createdAt: 1700000000000,
            description: 'desc',
            displayName: 'Test',
            id: 't1',
            isPublic: true,
            name: 'test',
        });
    });

    it('returns empty array when no topics exist', async () => {
        const res = await app.handle(new Request('http://localhost/topics'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual([]);
    });

    it('passes search query to prisma', async () => {
        const res = await app.handle(new Request('http://localhost/topics?q=test'));

        expect(res.status).toBe(200);

        const callArgs = prismaMock.topic.findMany.mock.calls[
            prismaMock.topic.findMany.mock.calls.length - 1
        ] as unknown as [{ where: { OR: Array<{ contains: string }> } }];

        expect(callArgs[0].where).toHaveProperty('OR');
    });

    it('response shape includes all required fields', async () => {
        prismaMock.topic.findMany.mockResolvedValueOnce([
            {
                createdAt: new Date(0),
                description: 'A test topic',
                displayName: 'Display',
                id: 't-full',
                isPublic: false,
                name: 'full-test',
            },
        ]);

        const res = await app.handle(new Request('http://localhost/topics'));
        const [topic] = await res.json();

        expect(topic).toHaveProperty('id');
        expect(topic).toHaveProperty('name');
        expect(topic).toHaveProperty('displayName');
        expect(topic).toHaveProperty('description');
        expect(topic).toHaveProperty('isPublic');
        expect(topic).toHaveProperty('createdAt');
    });
});
