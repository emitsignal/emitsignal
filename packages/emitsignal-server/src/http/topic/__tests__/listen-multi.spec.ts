import { describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

const mockBusSubscribe = mock(() => () => {});
const mockBusPublish = mock();

mock.module('../../../lib/event-bus', () => ({
    bus: {
        publish: mockBusPublish,
        subscribe: mockBusSubscribe,
    },
}));

import { listenMulti } from '../../topic/listen-multi';

describe('GET /listen (SSE multi-topic)', () => {
    const app = new Elysia().use(listenMulti);

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

    it('subscribes to wildcard when no topics are provided', async () => {
        await app.handle(new Request('http://localhost/listen'));

        expect(mockBusSubscribe).toHaveBeenCalledWith('*', expect.any(Function));
    });

    it('trims whitespace from topic names', async () => {
        await app.handle(new Request('http://localhost/listen?topics= topic-a , topic-b '));

        expect(mockBusSubscribe).toHaveBeenCalledWith('topic-a', expect.any(Function));
        expect(mockBusSubscribe).toHaveBeenCalledWith('topic-b', expect.any(Function));
    });
});
