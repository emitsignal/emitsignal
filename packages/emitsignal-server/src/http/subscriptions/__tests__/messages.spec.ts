import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { fileStorageMock, prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/storage', () => ({ FileStorageService: fileStorageMock }));

import { listSubscriptionMessages } from '#/http/subscriptions/messages';

const subscribedAt = new Date(1700000000000);

function lastFindManyWhere() {
    const call = prismaMock.message.findMany.mock.calls.at(-1) as unknown as
        | [args: { where?: unknown }]
        | undefined;

    return call?.[0]?.where;
}

function subscription(overrides: Record<string, unknown>) {
    return {
        createdAt: subscribedAt,
        deviceId: 'dev-1',
        id: 'sub-1',
        pushEnabled: true,
        settings: '{}',
        topic: { description: null, displayName: 'T', id: 't1', name: 'topic-1' },
        topicId: 't1',
        userId: null,
        ...overrides,
    };
}

describe('GET /subscriptions/messages', () => {
    const app = new Elysia().use(listSubscriptionMessages);

    it('returns an empty array when there are no subscriptions', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([]);

        const res = await app.handle(
            new Request('http://localhost/subscriptions/messages?deviceId=dev-1'),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ data: [], nextCursor: null });
    });

    it('defaults to subscription_date, filtering messages by the subscription createdAt', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([subscription({})]);
        prismaMock.message.findMany.mockResolvedValueOnce([]);

        await app.handle(new Request('http://localhost/subscriptions/messages?deviceId=dev-1'));

        const where = lastFindManyWhere();
        expect(where).toEqual({
            OR: [{ createdAt: { gte: subscribedAt }, topicId: 't1' }],
        });
    });

    it('omits the date filter when listenSince is always', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([
            subscription({ settings: '{"listenSince":"always"}' }),
        ]);
        prismaMock.message.findMany.mockResolvedValueOnce([]);

        await app.handle(new Request('http://localhost/subscriptions/messages?deviceId=dev-1'));

        const where = lastFindManyWhere();
        expect(where).toEqual({ OR: [{ topicId: 't1' }] });
    });

    it('builds the correct union for mixed subscriptions in a single query', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([
            subscription({ id: 'sub-1', topicId: 't1' }),
            subscription({
                id: 'sub-2',
                settings: '{"listenSince":"always"}',
                topic: {
                    description: null,
                    displayName: 'T2',
                    id: 't2',
                    name: 'topic-2',
                },
                topicId: 't2',
            }),
        ]);
        prismaMock.message.findMany.mockResolvedValueOnce([]);

        const callsBefore = prismaMock.message.findMany.mock.calls.length;
        await app.handle(new Request('http://localhost/subscriptions/messages?deviceId=dev-1'));
        const callsAfter = prismaMock.message.findMany.mock.calls.length;

        expect(callsAfter - callsBefore).toBe(1);

        const where = lastFindManyWhere();

        expect(where).toEqual({
            OR: [{ createdAt: { gte: subscribedAt }, topicId: 't1' }, { topicId: 't2' }],
        });
    });

    it('narrows to a single topic when topicName is provided', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([
            subscription({ id: 'sub-1', topicId: 't1' }),
            subscription({
                id: 'sub-2',
                settings: '{"listenSince":"always"}',
                topic: {
                    description: null,
                    displayName: 'T2',
                    id: 't2',
                    name: 'topic-2',
                },
                topicId: 't2',
            }),
        ]);

        prismaMock.message.findMany.mockResolvedValueOnce([]);

        await app.handle(
            new Request('http://localhost/subscriptions/messages?deviceId=dev-1&topicName=topic-2'),
        );

        const where = lastFindManyWhere();

        expect(where).toEqual({ OR: [{ topicId: 't2' }] });
    });

    it('returns an empty array when topicName is not among the subscriptions', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([subscription({})]);

        const callsBefore = prismaMock.message.findMany.mock.calls.length;
        const res = await app.handle(
            new Request(
                'http://localhost/subscriptions/messages?deviceId=dev-1&topicName=not-subscribed',
            ),
        );
        const callsAfter = prismaMock.message.findMany.mock.calls.length;

        expect(await res.json()).toEqual({ data: [], nextCursor: null });
        expect(callsAfter - callsBefore).toBe(0);
        expect(res.status).toBe(200);
    });

    it('adds a priority filter as a sibling of OR when minPriority is provided', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([
            subscription({ settings: '{"listenSince":"always"}' }),
        ]);
        prismaMock.message.findMany.mockResolvedValueOnce([]);

        await app.handle(
            new Request('http://localhost/subscriptions/messages?deviceId=dev-1&minPriority=4'),
        );

        const where = lastFindManyWhere();
        expect(where).toEqual({
            OR: [{ topicId: 't1' }],
            priority: { gte: 4 },
        });
    });

    it('adds a tags hasSome filter as a sibling of OR when tags is provided', async () => {
        prismaMock.subscription.findMany.mockResolvedValueOnce([
            subscription({ settings: '{"listenSince":"always"}' }),
        ]);
        prismaMock.message.findMany.mockResolvedValueOnce([]);

        await app.handle(
            new Request('http://localhost/subscriptions/messages?deviceId=dev-1&tags=sev2,infra'),
        );

        const where = lastFindManyWhere();
        expect(where).toEqual({
            OR: [{ topicId: 't1' }],
            tags: { hasSome: ['sev2', 'infra'] },
        });
    });
});
