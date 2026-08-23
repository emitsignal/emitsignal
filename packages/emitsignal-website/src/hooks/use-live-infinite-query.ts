import {
    type InfiniteData,
    type QueryClient,
    type QueryKey,
    useInfiniteQuery,
    useQueryClient,
} from '@tanstack/react-query';

import type { PaginatedResponse } from '#/lib/api';
import type { RealtimeMessage } from '#/lib/realtime';

import { useRealtimeTopics } from '#/ctx/realtime';

interface UseLiveInfiniteQueryOptions<TItem> {
    enabled?: boolean;
    onMessage: (queryClient: QueryClient, message: RealtimeMessage, queryKey: QueryKey) => void;
    queryFn: (cursor: string | undefined) => Promise<PaginatedResponse<TItem>>;
    queryKey: QueryKey;
    topicNames: (data: InfiniteData<PaginatedResponse<TItem>> | undefined) => readonly string[];
}

export function useLiveInfiniteQuery<TItem>({
    enabled,
    onMessage,
    queryFn,
    queryKey,
    topicNames,
}: UseLiveInfiniteQueryOptions<TItem>) {
    const queryClient = useQueryClient();

    const query = useInfiniteQuery<
        PaginatedResponse<TItem>,
        Error,
        InfiniteData<PaginatedResponse<TItem>>,
        QueryKey,
        string | undefined
    >({
        enabled,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialPageParam: undefined,
        queryFn: ({ pageParam }) => queryFn(pageParam),
        queryKey,
    });

    useRealtimeTopics({
        enabled: enabled !== false,
        onMessage: (message) => onMessage(queryClient, message, queryKey),
        topicNames: topicNames(query.data),
    });

    return query;
}
