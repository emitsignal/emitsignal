import { type QueryClient, type QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';

import type { RealtimeMessage } from '#/lib/realtime';

import { useRealtimeTopics } from '#/ctx/realtime';

interface UseLiveQueryOptions<TData> {
    enabled?: boolean;
    onMessage: (queryClient: QueryClient, message: RealtimeMessage) => void;
    queryFn: () => Promise<TData>;
    queryKey: QueryKey;
    staleTime?: number;
    topicNames: (data: TData | undefined) => readonly string[];
}

/**
 * Combines a cached `useQuery` with the shell's shared SSE stream. The query owns
 * the data (cache, staleTime, cross-navigation reuse); live `message` events patch
 * that same cache through `onMessage`, so live updates and navigated data stay in
 * sync. The topic list is derived from the current query data so hooks whose
 * topics come from their own result (feed, webhooks) work without extra state.
 */
export function useLiveQuery<TData>({
    enabled,
    onMessage,
    queryFn,
    queryKey,
    staleTime,
    topicNames,
}: UseLiveQueryOptions<TData>) {
    const queryClient = useQueryClient();

    const query = useQuery({ enabled, queryFn, queryKey, staleTime });

    useRealtimeTopics({
        enabled: enabled !== false,
        onMessage: (message) => onMessage(queryClient, message),
        topicNames: topicNames(query.data),
    });

    return query;
}
