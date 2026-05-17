import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

const mockBusSubscribe = mock(() => () => {});
const mockBusPublish = mock();

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));
mock.module('../../../lib/event-bus', () => ({
    bus: {
        publish: mockBusPublish,
        subscribe: mockBusSubscribe,
    },
}));

import { listen } from '../../topic/listen';

describe('GET /topics/:name/listen (SSE)', () => {
    const app = new Elysia().use(listen);

    it('returns SSE Content-Type header', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            id: 't1',
            name: 'test-topic',
        });

        const res = await app.handle(new Request('http://localhost/topics/test-topic/listen'));
        expect(res.headers.get('Content-Type')).toBe('text/event-stream');
        expect(res.headers.get('Cache-Control')).toContain('no-cache');
    });

    it('returns 404 when topic not found', async () => {
        const res = await app.handle(new Request('http://localhost/topics/nonexistent/listen'));
        expect(res.status).toBe(404);

        const data = await res.json();
        expect(data).toEqual({ error: 'topic_not_found' });
    });

    it('subscribes to the event bus for the topic', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            id: 't1',
            name: 'test-topic',
        });

        await app.handle(new Request('http://localhost/topics/test-topic/listen'));

        expect(mockBusSubscribe).toHaveBeenCalledWith('test-topic', expect.any(Function));
    });

    it('returns a response with status 200', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            id: 't1',
            name: 'test-topic',
        });

        const res = await app.handle(new Request('http://localhost/topics/test-topic/listen'));
        expect(res.status).toBe(200);
    });

    it('SSE response should not go through standard JSON body handling', async () => {
        prismaMock.topic.findUnique.mockResolvedValueOnce({
            id: 't1',
            name: 'test-topic',
        });

        const res = await app.handle(new Request('http://localhost/topics/test-topic/listen'));

        const contentType = res.headers.get('Content-Type') || '';
        expect(contentType).toContain('text/event-stream');
    });
});
