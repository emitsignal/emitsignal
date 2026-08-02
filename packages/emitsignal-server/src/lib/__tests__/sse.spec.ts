import { describe, expect, it, mock } from 'bun:test';

import { createSseStream, formatEvent, sseHeaders } from '../sse';

describe('formatEvent', () => {
    it('emits a named event frame', () => {
        expect(formatEvent('message', { id: 'm1' })).toBe('event: message\ndata: {"id":"m1"}\n\n');
    });

    // The webhook delivery stream sends nameless frames; the CLI reader only
    // parses `data:` lines, so this shape must not gain an `event:` prefix.
    it('emits a bare data frame when the event name is null', () => {
        expect(formatEvent(null, { id: 'd1' })).toBe('data: {"id":"d1"}\n\n');
    });
});

describe('sseHeaders', () => {
    it('disables caching and proxy buffering', () => {
        expect(sseHeaders()).toEqual({
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'Content-Type': 'text/event-stream',
            'X-Accel-Buffering': 'no',
        });
    });
});

describe('createSseStream', () => {
    function testSlot() {
        return { refresh: mock(async () => {}), release: mock(async () => {}) };
    }

    it('writes frames passed to send', async () => {
        const slot = testSlot();

        const stream = createSseStream({
            onStart: (send) => {
                send('message', { title: 'hello' });

                return () => {};
            },
            request: new Request('http://localhost/listen'),
            slot,
        });

        const reader = stream.getReader();
        const frame = new TextDecoder().decode((await reader.read()).value);
        await reader.cancel();

        expect(frame).toBe('event: message\ndata: {"title":"hello"}\n\n');
    });

    it('releases the slot and unsubscribes when the request aborts', async () => {
        const slot = testSlot();
        const unsubscribe = mock(() => {});
        const controller = new AbortController();

        const stream = createSseStream({
            onStart: () => unsubscribe,
            request: new Request('http://localhost/listen', { signal: controller.signal }),
            slot,
        });

        const reader = stream.getReader();
        await Bun.sleep(1);

        controller.abort();
        await Bun.sleep(1);

        expect(slot.release).toHaveBeenCalled();
        expect(unsubscribe).toHaveBeenCalled();

        await reader.cancel().catch(() => {});
    });

    // A backlog replay can run for a while; a client that gives up during it
    // must not strand its connection slot until the 2 minute TTL expires.
    it('releases the slot when the request aborts during onStart', async () => {
        const slot = testSlot();
        const unsubscribe = mock(() => {});
        const controller = new AbortController();

        const stream = createSseStream({
            onStart: async () => {
                await Bun.sleep(20);

                return unsubscribe;
            },
            request: new Request('http://localhost/listen', { signal: controller.signal }),
            slot,
        });

        const reader = stream.getReader();
        await Bun.sleep(1);

        controller.abort();
        await Bun.sleep(40);

        expect(slot.release).toHaveBeenCalled();
        expect(unsubscribe).toHaveBeenCalled();

        await reader.cancel().catch(() => {});
    });

    it('awaits an async onStart before the stream is consumed', async () => {
        const slot = testSlot();

        const stream = createSseStream({
            onStart: async (send) => {
                await Bun.sleep(1);
                send('message', { replayed: true });

                return () => {};
            },
            request: new Request('http://localhost/listen'),
            slot,
        });

        const reader = stream.getReader();
        const frame = new TextDecoder().decode((await reader.read()).value);
        await reader.cancel();

        expect(frame).toContain('"replayed":true');
    });
});
