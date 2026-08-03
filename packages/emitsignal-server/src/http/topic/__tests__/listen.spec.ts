import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { fileStorageMock, prismaMock } from '#/__tests__/mocks';

const mockBusSubscribe = mock(() => () => {});
const mockBusPublish = mock();

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/storage', () => ({ FileStorageService: fileStorageMock }));
mock.module('#/lib/event-bus', () => ({
    bus: {
        publish: mockBusPublish,
        subscribe: mockBusSubscribe,
    },
}));

import { listen } from '#/http/topic/listen';

const publicTopic = { accessMode: 'public', id: 't1', name: 'test-topic', ownerId: null };

describe('GET /topics/:name/listen (SSE)', () => {
    const app = new Elysia().use(listen);

    const originalTopicFindMany = prismaMock.topic.findMany;
    const originalMessageFindMany = prismaMock.message.findMany;

    beforeEach(() => {
        mockBusSubscribe.mockClear();
        prismaMock.topic.findMany = mock(() => Promise.resolve([publicTopic]));
        prismaMock.message.findMany = mock(() => Promise.resolve([]));
    });

    afterAll(() => {
        prismaMock.topic.findMany = originalTopicFindMany;
        prismaMock.message.findMany = originalMessageFindMany;
    });

    it('returns SSE Content-Type header', async () => {
        const res = await app.handle(new Request('http://localhost/topics/test-topic/listen'));

        expect(res.headers.get('Content-Type')).toBe('text/event-stream');
        expect(res.headers.get('Cache-Control')).toContain('no-cache');
    });

    it('subscribes to the event bus for the topic', async () => {
        await app.handle(new Request('http://localhost/topics/test-topic/listen'));

        expect(mockBusSubscribe).toHaveBeenCalledWith('test-topic', expect.any(Function));
    });

    it('returns a response with status 200', async () => {
        const res = await app.handle(new Request('http://localhost/topics/test-topic/listen'));

        expect(res.status).toBe(200);
    });

    it('SSE response should not go through standard JSON body handling', async () => {
        const res = await app.handle(new Request('http://localhost/topics/test-topic/listen'));

        const contentType = res.headers.get('Content-Type') || '';
        expect(contentType).toContain('text/event-stream');
    });

    // Publishing creates the topic on first use, so a listener is allowed to
    // connect before the topic exists rather than being turned away with a 404.
    it('streams a topic that does not exist yet', async () => {
        prismaMock.topic.findMany = mock(() => Promise.resolve([]));

        const res = await app.handle(new Request('http://localhost/topics/nonexistent/listen'));

        expect(res.status).toBe(200);
        expect(mockBusSubscribe).toHaveBeenCalledWith('nonexistent', expect.any(Function));
    });

    it('returns 404 when the topic exists but is not readable', async () => {
        prismaMock.topic.findMany = mock(() =>
            Promise.resolve([
                { accessMode: 'private', id: 't2', name: 'test-topic', ownerId: 'someone-else' },
            ]),
        );

        const res = await app.handle(new Request('http://localhost/topics/test-topic/listen'));

        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ error: 'topic_not_found' });
        expect(mockBusSubscribe).not.toHaveBeenCalled();
    });

    describe('?since= backlog replay', () => {
        const backlogMessage = {
            actions: '[]',
            body: 'replayed',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            id: 'msg-1',
            priority: 3,
            tags: [],
            title: 'old message',
            topicId: 't1',
        };

        it('replays messages created after the given timestamp', async () => {
            prismaMock.message.findMany = mock(() => Promise.resolve([backlogMessage]));

            const res = await app.handle(
                new Request('http://localhost/topics/test-topic/listen?since=1700000000000'),
            );

            const reader = res.body!.getReader();
            const frame = new TextDecoder().decode((await reader.read()).value);
            await reader.cancel();

            expect(frame).toContain('event: message');
            expect(frame).toContain('"title":"old message"');
            expect(frame).toContain('"topicName":"test-topic"');
        });

        it('includes attachments on replayed messages', async () => {
            prismaMock.message.findMany = mock(() => Promise.resolve([backlogMessage]));
            prismaMock.attachment.findMany = mock(() =>
                Promise.resolve([
                    {
                        filename: 'report.pdf',
                        mimeType: 'application/pdf',
                        size: 42,
                        storageKey: 'abc.pdf',
                    },
                ]),
            );

            const res = await app.handle(
                new Request('http://localhost/topics/test-topic/listen?since=1700000000000'),
            );

            const reader = res.body!.getReader();
            const frame = new TextDecoder().decode((await reader.read()).value);
            await reader.cancel();

            expect(frame).toContain('report.pdf');
            expect(prismaMock.attachment.findMany).toHaveBeenCalled();
        });

        it('does not query messages without a since parameter', async () => {
            await app.handle(new Request('http://localhost/topics/test-topic/listen'));

            expect(prismaMock.message.findMany).not.toHaveBeenCalled();
        });
    });
});
