import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSSE } from './use-sse';

const mockFetchEventSource = vi.fn();

vi.mock('@microsoft/fetch-event-source', () => ({
    fetchEventSource: (...args: unknown[]) => mockFetchEventSource(...args),
}));

type OnMessageHandler = (event: { data: string; event: string }) => void;

function captureOnMessage(): { trigger: OnMessageHandler } {
    const ref = { trigger: null as unknown as OnMessageHandler };

    mockFetchEventSource.mockImplementation(
        (_url: string, opts: { onmessage: OnMessageHandler }) => {
            ref.trigger = opts.onmessage;

            return Promise.resolve();
        },
    );

    return ref;
}

describe('useSSE', () => {
    beforeEach(() => {
        mockFetchEventSource.mockReset();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('ignores heartbeat events with empty data', () => {
        const handler = captureOnMessage();
        const onEvent = vi.fn();

        renderHook(() => useSSE({ onEvent, url: 'http://localhost/sse' }));

        handler.trigger({ data: '', event: '' });

        expect(onEvent).not.toHaveBeenCalled();
    });

    it('forwards events with JSON data', () => {
        const handler = captureOnMessage();
        const onEvent = vi.fn();

        renderHook(() => useSSE({ onEvent, url: 'http://localhost/sse' }));

        handler.trigger({ data: '{"id":"abc","body":"Hi!"}', event: 'message' });

        expect(onEvent).toHaveBeenCalledOnce();
        expect(onEvent).toHaveBeenCalledWith('message', { body: 'Hi!', id: 'abc' });
    });

    it('falls back to raw string when data is not valid JSON', () => {
        const handler = captureOnMessage();
        const onEvent = vi.fn();

        renderHook(() => useSSE({ onEvent, url: 'http://localhost/sse' }));

        handler.trigger({ data: 'plain text', event: 'message' });

        expect(onEvent).toHaveBeenCalledWith('message', 'plain text');
    });

    it('uses "message" as the event name when event field is empty', () => {
        const handler = captureOnMessage();
        const onEvent = vi.fn();

        renderHook(() => useSSE({ onEvent, url: 'http://localhost/sse' }));

        handler.trigger({ data: '{}', event: '' });

        expect(onEvent).toHaveBeenCalledWith('message', {});
    });

    it('does not connect when url is null', () => {
        renderHook(() => useSSE({ onEvent: vi.fn(), url: null }));

        expect(mockFetchEventSource).not.toHaveBeenCalled();
    });

    it('aborts the connection on unmount', () => {
        captureOnMessage();

        const { unmount } = renderHook(() => useSSE({ onEvent: vi.fn(), url: 'http://a/sse' }));

        const { signal } = mockFetchEventSource.mock.calls[0][1] as { signal: AbortSignal };

        expect(signal.aborted).toBe(false);

        unmount();

        expect(signal.aborted).toBe(true);
    });

    it('reconnects when the url changes', () => {
        captureOnMessage();

        const { rerender } = renderHook(
            ({ url }: { url: string }) => useSSE({ onEvent: vi.fn(), url }),
            {
                initialProps: { url: 'http://a/sse' },
            },
        );

        expect(mockFetchEventSource).toHaveBeenCalledOnce();

        rerender({ url: 'http://a/sse?since=1' });

        expect(mockFetchEventSource).toHaveBeenCalledTimes(2);
    });

    it('does not reconnect when only the event handler identity changes', () => {
        captureOnMessage();

        const { rerender } = renderHook(() => useSSE({ onEvent: vi.fn(), url: 'http://a/sse' }));

        rerender();

        expect(mockFetchEventSource).toHaveBeenCalledOnce();
    });
});
