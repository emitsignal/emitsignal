import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

import { subscriptionMetrics } from '#/http/subscriptions/metrics';

describe('GET /subscriptions/metrics', () => {
    const app = new Elysia().use(subscriptionMetrics);

    beforeEach(() => {
        prismaMock.subscription.findMany.mockClear();
        prismaMock.$queryRaw.mockClear();
    });

    it('returns 24h volume buckets keyed by topic id', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([
            { id: 'sub-1', topicId: 't1' },
            { id: 'sub-2', topicId: 't2' },
        ]);
        prismaMock.$queryRaw.mockResolvedValueOnce([
            { count: 3n, hoursAgo: 0, topicId: 't1' },
            { count: 2n, hoursAgo: 5, topicId: 't1' },
            { count: 1n, hoursAgo: 23, topicId: 't2' },
        ]);

        const res = await app.handle(
            new Request('http://localhost/subscriptions/metrics?deviceId=dev-1'),
        );
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.t1.messageCount24h).toBe(5);
        expect(data.t1.volume).toHaveLength(24);
        expect(data.t1.volume[23]).toBe(3); // hoursAgo 0 → newest bucket
        expect(data.t1.volume[18]).toBe(2); // hoursAgo 5
        expect(data.t2.messageCount24h).toBe(1);
        expect(data.t2.volume[0]).toBe(1); // hoursAgo 23 → oldest bucket
    });

    it('returns an empty object and skips the query when there are no subscriptions', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([]);

        const res = await app.handle(
            new Request('http://localhost/subscriptions/metrics?deviceId=dev-1'),
        );
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({});
        expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });

    it('scopes the anonymous device query to userId null', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([]);

        await app.handle(new Request('http://localhost/subscriptions/metrics?deviceId=dev-1'));

        expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { deviceId: 'dev-1', userId: null } }),
        );
    });
});
