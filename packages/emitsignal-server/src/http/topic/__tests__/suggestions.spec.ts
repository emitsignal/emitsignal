import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

import { suggestions } from '../../topic/suggestions';

describe('GET /suggestions', () => {
    const app = new Elysia().use(suggestions);

    beforeEach(() => {
        prismaMock.subscription.findMany.mockClear();
        prismaMock.topic.findMany.mockClear();
    });

    it('returns curated topics when no trending topics exist', async () => {
        const res = await app.handle(new Request('http://localhost/suggestions'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toEqual([
            {
                description: 'EmitSignal news & announcements',
                displayName: 'News',
                name: 'emitsignal/news',
            },
            {
                description: 'Discover trending topics & features',
                displayName: 'Discover',
                name: 'emitsignal/discover',
            },
        ]);
    });

    it('returns curated + trending topics without deviceId', async () => {
        const trending = makeTrendingTopics([
            ['t1', 'trending-1', 10],
            ['t2', 'trending-2', 5],
            ['t3', 'trending-3', 3],
        ]);

        prismaMock.topic.findMany.mockResolvedValueOnce(trending);

        const res = await app.handle(new Request('http://localhost/suggestions'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toHaveLength(5);
        expect(data[0]).toMatchObject({ name: 'emitsignal/news' });
        expect(data[1]).toMatchObject({ name: 'emitsignal/discover' });
        expect(data[2]).toMatchObject({ name: 'trending-1' });
        expect(data[3]).toMatchObject({ name: 'trending-2' });
        expect(data[4]).toMatchObject({ name: 'trending-3' });
    });

    it('excludes device subscriptions from trending results', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([{ topic: { name: 'my-topic' } }]);

        prismaMock.topic.findMany.mockResolvedValueOnce([makeTrendingTopic('ta', 'trend-a', 10)]);

        const res = await app.handle(new Request('http://localhost/suggestions?deviceId=dev-1'));

        expect(res.status).toBe(200);

        const trendingCall = prismaMock.topic.findMany.mock.calls[0] as unknown as [
            { where: { name: { notIn: string[] } } },
        ];

        expect(trendingCall[0].where.name.notIn).toContain('emitsignal/news');
        expect(trendingCall[0].where.name.notIn).toContain('emitsignal/discover');
        expect(trendingCall[0].where.name.notIn).toContain('my-topic');
    });

    it('fills remaining slots with device subscriptions', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([]);

        prismaMock.topic.findMany.mockResolvedValueOnce([
            makeTrendingTopic('t-solo', 'solo-trend', 10),
        ]);

        prismaMock.subscription.findMany.mockResolvedValueOnce([
            { topic: makeDeviceSub('sub1', 'my-sub-1') },
            { topic: makeDeviceSub('sub2', 'my-sub-2') },
            { topic: makeDeviceSub('sub3', 'my-sub-3') },
        ]);

        const res = await app.handle(new Request('http://localhost/suggestions?deviceId=dev-1'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toHaveLength(5);
        expect(data[0]).toMatchObject({ name: 'emitsignal/news' });
        expect(data[1]).toMatchObject({ name: 'emitsignal/discover' });
        expect(data[2]).toMatchObject({ name: 'solo-trend' });
        expect(data[3]).toMatchObject({ name: 'my-sub-1' });
        expect(data[4]).toMatchObject({ name: 'my-sub-2' });
    });

    it('fills remaining slots from device subscriptions when no trending available', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([{ topic: { name: 'only-topic' } }]);

        prismaMock.topic.findMany.mockResolvedValueOnce([]);

        prismaMock.subscription.findMany.mockResolvedValueOnce([
            { topic: makeDeviceSub('d1', 'device-1') },
            { topic: makeDeviceSub('d2', 'device-2') },
            { topic: makeDeviceSub('d3', 'device-3') },
        ]);

        const res = await app.handle(new Request('http://localhost/suggestions?deviceId=dev-1'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toHaveLength(5);
        expect(data[0]).toMatchObject({ name: 'emitsignal/news' });
        expect(data[1]).toMatchObject({ name: 'emitsignal/discover' });
        expect(data[2]).toMatchObject({ name: 'device-1' });
        expect(data[3]).toMatchObject({ name: 'device-2' });
        expect(data[4]).toMatchObject({ name: 'device-3' });
    });

    it('caps at 5 suggestions when more candidates are available', async () => {
        prismaMock.topic.findMany.mockResolvedValueOnce(
            makeTrendingTopics([
                ['t1', 't-1', 100],
                ['t2', 't-2', 90],
                ['t3', 't-3', 80],
                ['t4', 't-4', 70],
                ['t5', 't-5', 60],
            ]),
        );

        const res = await app.handle(new Request('http://localhost/suggestions'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toHaveLength(5);
        expect(data[0]).toMatchObject({ name: 'emitsignal/news' });
        expect(data[1]).toMatchObject({ name: 'emitsignal/discover' });
        expect(data[2]).toMatchObject({ name: 't-1' });
        expect(data[3]).toMatchObject({ name: 't-2' });
        expect(data[4]).toMatchObject({ name: 't-3' });
    });

    it('returns items with correct shape', async () => {
        prismaMock.topic.findMany.mockResolvedValueOnce([
            makeTrendingTopic('t-shape', 'test-topic', 10),
        ]);

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

    it('does not query subscriptions when deviceId is not provided', async () => {
        prismaMock.topic.findMany.mockResolvedValueOnce([]);

        const res = await app.handle(new Request('http://localhost/suggestions'));

        expect(res.status).toBe(200);
        expect(prismaMock.subscription.findMany).toHaveBeenCalledTimes(0);
    });
});

function makeDeviceSub(
    id: string,
    name: string,
): { description: string; displayName: string; id: string; name: string } {
    return {
        description: `Description for ${name}`,
        displayName: `Display ${name}`,
        id,
        name,
    };
}

function makeTrendingTopic(
    id: string,
    name: string,
    subCount: number,
): {
    _count: { subscriptions: number };
    createdAt: Date;
    description: string;
    displayName: string;
    id: string;
    isPublic: boolean;
    name: string;
} {
    return {
        _count: { subscriptions: subCount },
        createdAt: new Date(),
        description: `Description for ${name}`,
        displayName: `Display ${name}`,
        id,
        isPublic: true,
        name,
    };
}

function makeTrendingTopics(
    entries: [string, string, number][],
): ReturnType<typeof makeTrendingTopic>[] {
    return entries.map(([id, name, count]) => makeTrendingTopic(id, name, count));
}
