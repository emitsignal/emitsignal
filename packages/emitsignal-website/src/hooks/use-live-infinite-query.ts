import {
    type InfiniteData,
    type QueryClient,
    type QueryKey,
    useInfiniteQuery,
    useQueryClient,
} from '@tanstack/react-query';

import type { PaginatedResponse } from '#/lib/api';

import { useSession } from '#/ctx/session';

import { useSSE } from './use-sse';

interface UseLiveInfiniteQueryOptions<TItem> {
    enabled?: boolean;
    onMessage: (queryClient: QueryClient, data: unknown, queryKey: QueryKey) => void;
    queryFn: (cursor: string | undefined) => Promise<PaginatedResponse<TItem>>;
    queryKey: QueryKey;
    sseUrl: (data: InfiniteData<PaginatedResponse<TItem>> | undefined) => null | string;
}

export function useLiveInfiniteQuery<TItem>({
    enabled,
    onMessage,
    queryFn,
    queryKey,
    sseUrl,
}: UseLiveInfiniteQueryOptions<TItem>) {
    const queryClient = useQueryClient();
    const { loading: authLoading } = useSession();

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

    const target = sseUrl(query.data);

    useSSE({
        onEvent: (event, data) => {
            if (event !== 'message') {
                return;
            }

            onMessage(queryClient, data, queryKey);
        },
        url: !authLoading && target ? target : null,
    });

    return query;
}
