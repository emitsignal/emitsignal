import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));
mock.module('#/http/auth/plugin', () => ({ resolveUserId: resolveUserIdMock }));

import { listTopics } from '#/http/topic/list';

describe('GET /topics', () => {
    const app = new Elysia().use(listTopics);

    beforeEach(() => {
        prismaMock.topic.findMany.mockClear();
        resolveUserIdMock.mockReset();
        resolveUserIdMock.mockResolvedValue('user-1');
    });

    // mock.module is process-wide; restore the anonymous default so later test
    // files (e.g. subscriptions) see the real resolveUserId behaviour.
    afterAll(() => {
        resolveUserIdMock.mockReset();
        resolveUserIdMock.mockResolvedValue(null);
    });

    it('returns the owner topics when no query', async () => {
        const topics = [
            {
                accessMode: 'public',
                createdAt: new Date(1700000000000),
                description: 'desc',
                displayName: 'Test',
                id: 't1',
                name: 'test',
                ownerId: 'user-1',
            },
        ];

        prismaMock.topic.findMany.mockResolvedValueOnce(topics);

        const res = await app.handle(new Request('http://localhost/topics'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toBeArray();
        expect(data).toHaveLength(1);
        expect(data[0]).toEqual({
            accessMode: 'public',
            createdAt: 1700000000000,
            description: 'desc',
            displayName: 'Test',
            id: 't1',
            isOwner: true,
            name: 'test',
            ownerId: 'user-1',
        });
    });

    it('scopes the query to the authenticated owner', async () => {
        prismaMock.topic.findMany.mockResolvedValueOnce([]);

        await app.handle(new Request('http://localhost/topics'));

        const callArgs = prismaMock.topic.findMany.mock.calls[
            prismaMock.topic.findMany.mock.calls.length - 1
        ] as unknown as [{ where: { ownerId: string } }];

        expect(callArgs[0].where.ownerId).toBe('user-1');
    });

    it('returns an empty array without querying when no user is resolved', async () => {
        // authAwareBeforeHandle calls resolveUserId once, then the route handler calls it again.
        resolveUserIdMock.mockResolvedValueOnce(null);
        resolveUserIdMock.mockResolvedValueOnce(null);

        const res = await app.handle(new Request('http://localhost/topics'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual([]);
        expect(prismaMock.topic.findMany).toHaveBeenCalledTimes(0);
    });

    it('returns empty array when the owner has no topics', async () => {
        prismaMock.topic.findMany.mockResolvedValueOnce([]);

        const res = await app.handle(new Request('http://localhost/topics'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual([]);
    });

    it('passes search query to prisma scoped to the owner', async () => {
        prismaMock.topic.findMany.mockResolvedValueOnce([]);

        const res = await app.handle(new Request('http://localhost/topics?q=test'));

        expect(res.status).toBe(200);

        const callArgs = prismaMock.topic.findMany.mock.calls[
            prismaMock.topic.findMany.mock.calls.length - 1
        ] as unknown as [{ where: { OR: Array<{ contains: string }>; ownerId: string } }];

        expect(callArgs[0].where).toHaveProperty('OR');
        expect(callArgs[0].where.ownerId).toBe('user-1');
    });

    it('response shape includes all required fields', async () => {
        prismaMock.topic.findMany.mockResolvedValueOnce([
            {
                accessMode: 'private',
                createdAt: new Date(0),
                description: 'A test topic',
                displayName: 'Display',
                id: 't-full',
                name: 'full-test',
                ownerId: 'user-1',
            },
        ]);

        const res = await app.handle(new Request('http://localhost/topics'));
        const [topic] = await res.json();

        expect(topic).toHaveProperty('accessMode');
        expect(topic).toHaveProperty('createdAt');
        expect(topic).toHaveProperty('description');
        expect(topic).toHaveProperty('displayName');
        expect(topic).toHaveProperty('id');
        expect(topic).toHaveProperty('name');
    });
});
