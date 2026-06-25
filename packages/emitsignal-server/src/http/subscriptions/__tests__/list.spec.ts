import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

import { listSubscriptions } from '../../subscriptions/list';

describe('GET /subscriptions', () => {
    const app = new Elysia().use(listSubscriptions);

    it('returns subscriptions for a device', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([
            {
                createdAt: new Date(1700000000000),
                id: 'sub-1',
                pushEnabled: true,
                settings: '{"listenSince":"always"}',
                topic: {
                    description: 'desc',
                    displayName: 'Test',
                    id: 't1',
                    isPublic: true,
                    name: 'test-topic',
                },
            },
        ]);

        const res = await app.handle(new Request('http://localhost/subscriptions?deviceId=dev-1'));
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toBeArray();
        expect(data[0]).toEqual({
            createdAt: 1700000000000,
            id: 'sub-1',
            pushEnabled: true,
            settings: { listenSince: 'always' },
            topic: {
                description: 'desc',
                displayName: 'Test',
                id: 't1',
                isPublic: true,
                name: 'test-topic',
            },
        });
    });

    it('scopes the anonymous device query to userId null', async () => {
        await app.handle(new Request('http://localhost/subscriptions?deviceId=dev-1'));

        expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { deviceId: 'dev-1', userId: null },
            }),
        );
    });

    it('returns empty array when no subscriptions exist', async () => {
        const res = await app.handle(new Request('http://localhost/subscriptions?deviceId=dev-1'));
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual([]);
    });

    it('returns an empty array when unauthenticated and missing deviceId', async () => {
        const res = await app.handle(new Request('http://localhost/subscriptions'));
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toEqual([]);
    });
});
