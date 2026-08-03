import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

import { updateSubscription } from '#/http/subscriptions/update';

const topic = {
    accessMode: 'public',
    description: null,
    displayName: 'T',
    id: 't1',
    name: 'topic-1',
    ownerId: null,
};

function patch(body: Record<string, unknown>) {
    return new Request('http://localhost/subscriptions/sub-1', {
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
        method: 'PATCH',
    });
}

function stored(overrides: Record<string, unknown>) {
    return {
        createdAt: new Date(1700000000000),
        deviceId: 'dev-1',
        id: 'sub-1',
        pushEnabled: true,
        settings: '{"listenSince":"subscription_date"}',
        topic,
        topicId: 't1',
        userId: null,
        ...overrides,
    };
}

describe('PATCH /subscriptions/:id', () => {
    const app = new Elysia().use(updateSubscription);

    it('returns 404 when the subscription does not exist', async () => {
        prismaMock.subscription.findUnique.mockResolvedValueOnce(null);

        const res = await app.handle(patch({ deviceId: 'dev-1', pushEnabled: false }));
        expect(res.status).toBe(404);
    });

    it('returns 403 when the device does not own the subscription', async () => {
        prismaMock.subscription.findUnique.mockResolvedValueOnce(stored({ deviceId: 'other' }));

        const res = await app.handle(patch({ deviceId: 'dev-1', pushEnabled: false }));
        expect(res.status).toBe(403);
    });

    it('updates settings while preserving pushEnabled', async () => {
        prismaMock.subscription.findUnique.mockResolvedValueOnce(stored({ pushEnabled: false }));
        prismaMock.subscription.update.mockResolvedValueOnce(
            stored({ pushEnabled: false, settings: '{"listenSince":"always"}' }),
        );

        const res = await app.handle(
            patch({ deviceId: 'dev-1', settings: { listenSince: 'always' } }),
        );
        expect(res.status).toBe(200);

        const data = prismaMock.subscription.update.mock.calls.at(-1)?.[0].data;
        expect(data.pushEnabled).toBe(false);
        expect(data.settings).toBe('{"listenSince":"always"}');

        expect(await res.json()).toMatchObject({
            pushEnabled: false,
            settings: { listenSince: 'always' },
        });
    });

    it('updates pushEnabled while preserving settings', async () => {
        prismaMock.subscription.findUnique.mockResolvedValueOnce(
            stored({ pushEnabled: true, settings: '{"listenSince":"always"}' }),
        );
        prismaMock.subscription.update.mockResolvedValueOnce(
            stored({ pushEnabled: false, settings: '{"listenSince":"always"}' }),
        );

        const res = await app.handle(patch({ deviceId: 'dev-1', pushEnabled: false }));
        expect(res.status).toBe(200);

        const data = prismaMock.subscription.update.mock.calls.at(-1)?.[0].data;
        expect(data.pushEnabled).toBe(false);
        expect(data.settings).toBe('{"listenSince":"always"}');
    });
});
