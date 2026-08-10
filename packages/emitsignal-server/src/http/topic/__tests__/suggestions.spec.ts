import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

// Header-driven so a leak into other test files behaves like the real module
// (no test header → anonymous).
mock.module('#/http/auth/plugin', () => ({
    resolveUserId: ({ headers }: { headers: Record<string, string | undefined> }) =>
        Promise.resolve(headers['x-test-user-id'] ?? null),
}));

import { suggestions } from '#/http/topic/suggestions';

const NEWS = 'emitsignal/news';
const DISCOVER = 'emitsignal/discover';

describe('GET /suggestions', () => {
    const app = new Elysia().use(suggestions);

    beforeEach(() => {
        prismaMock.subscription.findMany.mockClear();
        prismaMock.topic.findMany.mockClear();
    });

    it('returns curated topics', async () => {
        const res = await app.handle(new Request('http://localhost/suggestions'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual([
            {
                description: 'EmitSignal news & announcements',
                displayName: 'News',
                name: NEWS,
            },
            {
                description: 'Discover trending topics & features',
                displayName: 'Discover',
                name: DISCOVER,
            },
        ]);
    });

    it('excludes curated topics the anonymous device is already subscribed to', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([
            { deviceId: 'dev-1', topic: { name: NEWS }, topicId: 't1' },
        ]);

        const res = await app.handle(new Request('http://localhost/suggestions?deviceId=dev-1'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toHaveLength(1);
        expect(data[0]).toMatchObject({ name: DISCOVER });
    });

    it('scopes the anonymous device query to userId null', async () => {
        await app.handle(new Request('http://localhost/suggestions?deviceId=dev-1'));

        expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { deviceId: 'dev-1', userId: null },
            }),
        );
    });

    it('excludes topics the signed-in account is subscribed to without a deviceId', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([
            { deviceId: 'dev-other', topic: { name: NEWS }, topicId: 't1' },
        ]);

        const res = await app.handle(
            new Request('http://localhost/suggestions', {
                headers: { 'x-test-user-id': 'user-1' },
            }),
        );

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toHaveLength(1);
        expect(data[0]).toMatchObject({ name: DISCOVER });
        expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: 'user-1' } }),
        );
    });

    it('excludes account subscriptions made on another device', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([
            { deviceId: 'dev-a', topic: { name: NEWS }, topicId: 't1' },
            { deviceId: 'dev-a', topic: { name: DISCOVER }, topicId: 't2' },
        ]);

        const res = await app.handle(
            new Request('http://localhost/suggestions?deviceId=dev-b', {
                headers: { 'x-test-user-id': 'user-1' },
            }),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual([]);
    });

    it('returns items with correct shape', async () => {
        const res = await app.handle(new Request('http://localhost/suggestions'));

        expect(res.status).toBe(200);

        const data = await res.json();

        for (const item of data) {
            expect(item).toHaveProperty('description');
            expect(item).toHaveProperty('displayName');
            expect(item).toHaveProperty('name');
            expect(item.description === null || typeof item.description === 'string').toBe(true);
            expect(typeof item.displayName).toBe('string');
            expect(typeof item.name).toBe('string');
        }
    });

    it('does not query subscriptions when anonymous and no deviceId is provided', async () => {
        const res = await app.handle(new Request('http://localhost/suggestions'));

        expect(res.status).toBe(200);
        expect(prismaMock.subscription.findMany).toHaveBeenCalledTimes(0);
    });
});
