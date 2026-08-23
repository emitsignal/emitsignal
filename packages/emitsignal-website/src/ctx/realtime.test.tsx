import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RealtimeMessage } from '#/lib/realtime';

import { REALTIME_SETTLE_DELAY_MS } from '#/lib/realtime';

import { RealtimeProvider, useRealtimeTopics } from './realtime';

const mockFetchEventSource = vi.fn();

vi.mock('@microsoft/fetch-event-source', () => ({
    fetchEventSource: (...args: unknown[]) => mockFetchEventSource(...args),
}));

const subscriptionsState = { loading: false, topicNames: ['alerts', 'deploys'] };

vi.mock('#/ctx/session', () => ({
    useSession: () => ({ loading: false, user: { id: 'user-1' } }),
}));

vi.mock('#/ctx/subscriptions', () => ({
    useSubscriptions: () => ({
        loading: subscriptionsState.loading,
        subscriptions: subscriptionsState.topicNames.map((name) => ({ topic: { name } })),
    }),
}));

function connectedUrls(): string[] {
    return mockFetchEventSource.mock.calls.map((call) => call[0] as string);
}

function emit(message: Partial<RealtimeMessage>, event = 'message') {
    const options = mockFetchEventSource.mock.lastCall?.[1] as {
        onmessage: (frame: { data: string; event: string }) => void;
    };

    act(() => {
        options.onmessage({ data: JSON.stringify(message), event });
    });
}

function makeMessage(overrides: Partial<RealtimeMessage>): Partial<RealtimeMessage> {
    return { createdAt: Date.now(), id: 'message-1', topicName: 'alerts', ...overrides };
}

function settle() {
    act(() => {
        vi.advanceTimersByTime(REALTIME_SETTLE_DELAY_MS);
    });
}

function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    return (
        <QueryClientProvider client={queryClient}>
            <RealtimeProvider>{children}</RealtimeProvider>
        </QueryClientProvider>
    );
}

describe('RealtimeProvider', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockFetchEventSource.mockReset();
        mockFetchEventSource.mockResolvedValue(undefined);
        subscriptionsState.loading = false;
        subscriptionsState.topicNames = ['alerts', 'deploys'];
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('opens a single connection covering every registered topic', () => {
        renderHook(
            () => {
                useRealtimeTopics({ onMessage: vi.fn(), topicNames: ['deploys'] });
                useRealtimeTopics({ onMessage: vi.fn(), topicNames: ['builds', 'alerts'] });
            },
            { wrapper },
        );

        settle();

        expect(mockFetchEventSource).toHaveBeenCalledOnce();
        expect(connectedUrls()[0]).toContain('/listen?topics=alerts,builds,deploys');
    });

    it('does not reconnect when a subscriber remounts with the same topics', () => {
        function Consumer() {
            useRealtimeTopics({ onMessage: vi.fn(), topicNames: ['alerts'] });

            return null;
        }

        const { rerender } = render(<Consumer />, { wrapper });

        settle();
        expect(mockFetchEventSource).toHaveBeenCalledOnce();

        // Sibling-route navigation: unmount then remount inside the settle window.
        rerender(<div />);
        rerender(<Consumer />);
        settle();

        expect(mockFetchEventSource).toHaveBeenCalledOnce();
    });

    it('reconnects once with a since window when a new topic joins', () => {
        const { rerender } = renderHook(
            ({ topicName }: { topicName: string }) => {
                useRealtimeTopics({ onMessage: vi.fn(), topicNames: [topicName] });
            },
            { initialProps: { topicName: 'alerts' }, wrapper },
        );

        settle();

        expect(connectedUrls()[0]).not.toContain('since=');

        rerender({ topicName: 'ad-hoc' });
        settle();

        expect(mockFetchEventSource).toHaveBeenCalledTimes(2);
        expect(connectedUrls()[1]).toContain('topics=ad-hoc,alerts,deploys');
        expect(connectedUrls()[1]).toContain('since=');
    });

    it('dispatches a message only to subscribers of its topic', () => {
        const onAlerts = vi.fn();
        const onDeploys = vi.fn();

        renderHook(
            () => {
                useRealtimeTopics({ onMessage: onAlerts, topicNames: ['alerts'] });
                useRealtimeTopics({ onMessage: onDeploys, topicNames: ['deploys'] });
            },
            { wrapper },
        );

        settle();
        emit(makeMessage({ topicName: 'deploys' }));

        expect(onAlerts).not.toHaveBeenCalled();
        expect(onDeploys).toHaveBeenCalledOnce();
    });

    it('ignores malformed payloads and non-message events', () => {
        const onMessage = vi.fn();

        renderHook(() => useRealtimeTopics({ onMessage, topicNames: ['alerts'] }), { wrapper });

        settle();
        emit({ id: 'no-topic' });
        emit(makeMessage({}), 'ping');

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('excludes disabled subscribers from the topic union', () => {
        renderHook(
            () => {
                useRealtimeTopics({ enabled: false, onMessage: vi.fn(), topicNames: ['disabled'] });
            },
            { wrapper },
        );

        settle();

        expect(connectedUrls()[0]).not.toContain('disabled');
    });

    it('does not dispatch replayed messages older than the subscriber', () => {
        const onMessage = vi.fn();

        renderHook(() => useRealtimeTopics({ onMessage, topicNames: ['alerts'] }), { wrapper });

        settle();
        emit(makeMessage({ createdAt: Date.now() - 60_000 }));

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('stays closed until subscriptions have loaded', () => {
        subscriptionsState.loading = true;

        renderHook(() => useRealtimeTopics({ onMessage: vi.fn(), topicNames: ['alerts'] }), {
            wrapper,
        });

        settle();

        expect(mockFetchEventSource).not.toHaveBeenCalled();
    });
});
