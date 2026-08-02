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
    const originalMessageFindMany = prismaMock.message.findMany;

    beforeEach(() => {
        mockBusSubscribe.mockClear();
        resolveUserIdMock.mockResolvedValue(null);
        prismaMock.topic.findMany = mock(() => Promise.resolve([]));
        prismaMock.subscription.findMany = mock(() => Promise.resolve([]));
        prismaMock.message.findMany = mock(() => Promise.resolve([]));
    });

    afterAll(() => {
        prismaMock.topic.findMany = originalTopicFindMany;
        prismaMock.subscription.findMany = originalSubscriptionFindMany;
        prismaMock.message.findMany = originalMessageFindMany;
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

    describe('topic access', () => {
        it('skips an unreadable topic but still streams its readable siblings', async () => {
            prismaMock.topic.findMany = mock(() =>
                Promise.resolve([
                    { accessMode: 'public', id: 't1', name: 'topic-a', ownerId: null },
                    { accessMode: 'private', id: 't2', name: 'topic-b', ownerId: 'someone-else' },
                ]),
            );

            const res = await app.handle(
                new Request('http://localhost/listen?topics=topic-a,topic-b'),
            );

            expect(res.status).toBe(200);
            expect(mockBusSubscribe).toHaveBeenCalledWith('topic-a', expect.any(Function));
            expect(mockBusSubscribe).not.toHaveBeenCalledWith('topic-b', expect.any(Function));
        });

        it('returns 404 when no requested topic is readable', async () => {
            prismaMock.topic.findMany = mock(() =>
                Promise.resolve([
                    { accessMode: 'private', id: 't2', name: 'topic-b', ownerId: 'someone-else' },
                ]),
            );

            const res = await app.handle(new Request('http://localhost/listen?topics=topic-b'));

            expect(res.status).toBe(404);
            expect((await res.json()).error).toBe('topic_not_found');
            expect(mockBusSubscribe).not.toHaveBeenCalled();
        });
    });

    describe('?since= backlog replay', () => {
        it('replays messages across every readable topic', async () => {
            prismaMock.topic.findMany = mock(() =>
                Promise.resolve([
                    { accessMode: 'public', id: 't1', name: 'topic-a', ownerId: null },
                    { accessMode: 'public', id: 't2', name: 'topic-b', ownerId: null },
                ]),
            );
            prismaMock.message.findMany = mock(() =>
                Promise.resolve([
                    {
                        actions: '[]',
                        body: 'from b',
                        createdAt: new Date('2026-01-01T00:00:00.000Z'),
                        id: 'msg-1',
                        priority: 3,
                        tags: [],
                        title: 'backlog',
                        topicId: 't2',
                    },
                ]),
            );

            const res = await app.handle(
                new Request('http://localhost/listen?topics=topic-a,topic-b&since=1700000000000'),
            );

            const reader = res.body!.getReader();
            const frame = new TextDecoder().decode((await reader.read()).value);
            await reader.cancel();

            expect(frame).toContain('event: message');
            expect(frame).toContain('"title":"backlog"');
            // Resolved from the owning topic id, not the first requested topic.
            expect(frame).toContain('"topicName":"topic-b"');
        });

        it('does not query messages without a since parameter', async () => {
            await app.handle(new Request('http://localhost/listen?topics=topic-a'));

            expect(prismaMock.message.findMany).not.toHaveBeenCalled();
        });
    });
});
