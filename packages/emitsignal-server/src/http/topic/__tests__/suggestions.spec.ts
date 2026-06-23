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

    it('returns curated topics', async () => {
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

    it('excludes curated topics the device is already subscribed to', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([
            { topic: { name: 'emitsignal/news' } },
        ]);

        const res = await app.handle(new Request('http://localhost/suggestions?deviceId=dev-1'));

        expect(res.status).toBe(200);

        const data = await res.json();

        expect(data).toHaveLength(1);
        expect(data[0]).toMatchObject({ name: 'emitsignal/discover' });
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

    it('does not query subscriptions when deviceId is not provided', async () => {
        const res = await app.handle(new Request('http://localhost/suggestions'));

        expect(res.status).toBe(200);
        expect(prismaMock.subscription.findMany).toHaveBeenCalledTimes(0);
    });
});
