import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

const mockBusSubscribe = mock(() => () => {});
const mockBusPublish = mock();

mock.module('../../../lib/event-bus', () => ({
    bus: {
        publish: mockBusPublish,
        subscribe: mockBusSubscribe,
    },
}));

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));

const resolveUserIdMock = mock<() => Promise<null | string>>(() => Promise.resolve(null));
mock.module('../../auth/plugin', () => ({ resolveUserId: resolveUserIdMock }));

import { listenMulti } from '../../topic/listen-multi';

describe('GET /listen (SSE multi-topic)', () => {
    const app = new Elysia().use(listenMulti);

    const originalTopicFindMany = prismaMock.topic.findMany;
    const originalSubscriptionFindMany = prismaMock.subscription.findMany;

    beforeEach(() => {
        resolveUserIdMock.mockResolvedValue(null);
        prismaMock.topic.findMany = mock(() => Promise.resolve([]));
        prismaMock.subscription.findMany = mock(() => Promise.resolve([]));
    });

    afterAll(() => {
        prismaMock.topic.findMany = originalTopicFindMany;
        prismaMock.subscription.findMany = originalSubscriptionFindMany;
    });

    it('returns SSE Content-Type header', async () => {
        const res = await app.handle(new Request('http://localhost/listen?topics=topic-a,topic-b'));

        expect(res.headers.get('Content-Type')).toBe('text/event-stream');
        expect(res.headers.get('Cache-Control')).toContain('no-cache');
    });

    it('subscribes to specific topics when topics param is provided', async () => {
        await app.handle(new Request('http://localhost/listen?topics=topic-a,topic-b'));

        expect(mockBusSubscribe).toHaveBeenCalledWith('topic-a', expect.any(Function));
        expect(mockBusSubscribe).toHaveBeenCalledWith('topic-b', expect.any(Function));
    });

    it('trims whitespace from topic names', async () => {
        await app.handle(new Request('http://localhost/listen?topics= topic-a , topic-b '));

        expect(mockBusSubscribe).toHaveBeenCalledWith('topic-a', expect.any(Function));
        expect(mockBusSubscribe).toHaveBeenCalledWith('topic-b', expect.any(Function));
    });

    describe('wildcard scoping', () => {
        it('rejects an anonymous listener that provides no topics', async () => {
            mockBusSubscribe.mockClear();
            resolveUserIdMock.mockResolvedValue(null);

            const res = await app.handle(new Request('http://localhost/listen'));

            expect(res.status).toBe(400);
            expect((await res.json()).error).toBe('topics_required');
            expect(mockBusSubscribe).not.toHaveBeenCalled();
        });

        it('never subscribes to the global wildcard channel', async () => {
            mockBusSubscribe.mockClear();
            resolveUserIdMock.mockResolvedValue('user-1');
            prismaMock.topic.findMany = mock(() => Promise.resolve([]));
            prismaMock.subscription.findMany = mock(() => Promise.resolve([]));

            await app.handle(new Request('http://localhost/listen'));

            expect(mockBusSubscribe).not.toHaveBeenCalledWith('*', expect.any(Function));
        });

        it('scopes an authenticated wildcard to owned and subscribed topics', async () => {
            mockBusSubscribe.mockClear();
            resolveUserIdMock.mockResolvedValue('user-1');

            prismaMock.topic.findMany = mock(() => Promise.resolve([{ name: 'owned-topic' }]));
            prismaMock.subscription.findMany = mock(() =>
                Promise.resolve([{ topic: { name: 'subscribed-topic' } }]),
            );

            await app.handle(new Request('http://localhost/listen'));

            expect(mockBusSubscribe).toHaveBeenCalledWith('owned-topic', expect.any(Function));
            expect(mockBusSubscribe).toHaveBeenCalledWith('subscribed-topic', expect.any(Function));
        });
    });
});
