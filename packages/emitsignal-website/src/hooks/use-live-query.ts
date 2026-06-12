import { type QueryClient, type QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '#/ctx/session';

import { useSSE } from './use-sse';

interface UseLiveQueryOptions<TData> {
    enabled?: boolean;
    onMessage: (queryClient: QueryClient, data: unknown) => void;
    queryFn: () => Promise<TData>;
    queryKey: QueryKey;
    sseUrl: (data: TData | undefined) => null | string;
}

/**
 * Combines a cached `useQuery` with a live SSE connection. The query owns the
 * data (cache, staleTime, cross-navigation reuse); SSE `message` events patch
 * that same cache through `onMessage`, so live updates and navigated data stay
 * in sync. The stream URL is derived from the current query data so hooks whose
 * topics come from their own result (feed, webhooks) work without extra state.
 */
export function useLiveQuery<TData>({
    enabled,
    onMessage,
    queryFn,
    queryKey,
    sseUrl,
}: UseLiveQueryOptions<TData>) {
    const queryClient = useQueryClient();
    const { loading: authLoading } = useSession();

    const query = useQuery({ enabled, queryFn, queryKey });

    const target = sseUrl(query.data);

    useSSE({
        onEvent: (event, data) => {
            if (event !== 'message') {
                return;
            }

            onMessage(queryClient, data);
        },
        url: !authLoading && target ? target : null,
    });

    return query;
}
