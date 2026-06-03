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
});
