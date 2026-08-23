import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RealtimeMessage } from '#/lib/realtime';

import { RealtimeProvider } from '#/ctx/realtime';
import { REALTIME_SETTLE_DELAY_MS } from '#/lib/realtime';

import { useLiveQuery } from './use-live-query';

const mockFetchEventSource = vi.fn();

vi.mock('@microsoft/fetch-event-source', () => ({
    fetchEventSource: (...args: unknown[]) => mockFetchEventSource(...args),
}));

vi.mock('#/ctx/session', () => ({
    useSession: () => ({ loading: false, user: { id: 'user-1' } }),
}));

vi.mock('#/ctx/subscriptions', () => ({
    useSubscriptions: () => ({ loading: false, subscriptions: [] }),
}));

function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    return (
        <QueryClientProvider client={queryClient}>
            <RealtimeProvider>{children}</RealtimeProvider>
        </QueryClientProvider>
    );
}

describe('useLiveQuery', () => {
    beforeEach(() => {
        mockFetchEventSource.mockReset();
        mockFetchEventSource.mockResolvedValue(undefined);
    });

    it('derives its topics from query data once the query resolves', async () => {
        renderHook(
            () =>
                useLiveQuery<{ topicName: string }[]>({
                    onMessage: vi.fn(),
                    queryFn: async () => [{ topicName: 'billing' }],
                    queryKey: ['live-query-topics'],
                    topicNames: (data) => (data ?? []).map((row) => row.topicName),
                }),
            { wrapper },
        );

        await waitFor(() => expect(mockFetchEventSource).toHaveBeenCalledOnce(), {
            timeout: REALTIME_SETTLE_DELAY_MS * 10,
        });

        expect(mockFetchEventSource.mock.calls[0][0]).toContain('topics=billing');
    });

    it('hands the query client a typed message', async () => {
        const onMessage = vi.fn();

        renderHook(
            () =>
                useLiveQuery<{ topicName: string }[]>({
                    onMessage,
                    queryFn: async () => [{ topicName: 'billing' }],
                    queryKey: ['live-query-dispatch'],
                    topicNames: (data) => (data ?? []).map((row) => row.topicName),
                }),
            { wrapper },
        );

        await waitFor(() => expect(mockFetchEventSource).toHaveBeenCalledOnce(), {
            timeout: REALTIME_SETTLE_DELAY_MS * 10,
        });

        const options = mockFetchEventSource.mock.lastCall?.[1] as {
            onmessage: (frame: { data: string; event: string }) => void;
        };
        const message: Partial<RealtimeMessage> = {
            createdAt: Date.now() + 1_000,
            id: 'message-1',
            topicName: 'billing',
        };

        act(() => {
            options.onmessage({ data: JSON.stringify(message), event: 'message' });
        });

        expect(onMessage).toHaveBeenCalledWith(expect.anything(), message);
    });
});
