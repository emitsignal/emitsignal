import { type InfiniteData } from '@tanstack/react-query';

import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { api, type Message, type PaginatedResponse, sseMultiUrl, sseUrl } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

import { useBoundedPending } from './use-bounded-pending';
import { useLiveInfiniteQuery } from './use-live-infinite-query';
import { useSubscriptions } from './use-subscriptions';

export function useFeed() {
    const { deviceId } = useDevice();
    const { loading: sessionLoading, user } = useSession();
    const { subscriptions } = useSubscriptions();

    const userId = user?.id;
    const scope = userId ?? deviceId ?? '';
    const topicNames = subscriptions.map((subscription) => subscription.topic.name);

    const enabled = !sessionLoading && Boolean(userId || deviceId);

    const query = useLiveInfiniteQuery<Message>({
        enabled,
        onMessage: (queryClient, data, queryKey) => {
            const incoming = data as { topicName?: string } & Message;

            queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
                queryKey,
                (previous) => {
                    if (!previous) {
                        return previous;
                    }

                    const firstPage = previous.pages[0];

                    if (
                        !firstPage ||
                        firstPage.data.some((message) => message.id === incoming.id)
                    ) {
                        return previous;
                    }

                    return {
                        ...previous,
                        pages: [
                            { ...firstPage, data: [incoming, ...firstPage.data] },
                            ...previous.pages.slice(1),
                        ],
                    };
                },
            );
        },
        queryFn: (cursor) =>
            api.listSubscriptionMessages(deviceId ?? undefined, { cursor, limit: 50 }),
        queryKey: queryKeys.feed(scope),
        sseUrl: () => (topicNames.length ? sseMultiUrl(topicNames) : null),
    });

    // A disabled query reports `status: 'pending'`; only treat the screen as
    // loading while it actually fetches, or while prerequisites resolve.
    const waitingForPrerequisites = useBoundedPending(!enabled);
    const loading = enabled ? query.isLoading : waitingForPrerequisites;

    return {
        error: query.error instanceof Error ? query.error : null,
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        loading,
        messages: query.data?.pages.flatMap((page) => page.data) ?? [],
        refresh: () => query.refetch(),
        refreshing: query.isFetching && !query.isFetchingNextPage,
        subscriptions,
    };
}

export function useTopicMessages(topicName: null | string) {
    const { deviceId } = useDevice();

    const enabled = Boolean(topicName);

    const query = useLiveInfiniteQuery<Message>({
        enabled,
        onMessage: (queryClient, data, queryKey) => {
            if (!topicName) {
                return;
            }

            const incoming = data as Message;

            queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
                queryKey,
                (previous) => {
                    if (!previous) {
                        return previous;
                    }

                    const firstPage = previous.pages[0];

                    if (
                        !firstPage ||
                        firstPage.data.some((message) => message.id === incoming.id)
                    ) {
                        return previous;
                    }

                    return {
                        ...previous,
                        pages: [
                            { ...firstPage, data: [incoming, ...firstPage.data] },
                            ...previous.pages.slice(1),
                        ],
                    };
                },
            );
        },
        queryFn: (cursor) =>
            api.listSubscriptionMessages(deviceId ?? undefined, {
                cursor,
                limit: 50,
                topicName: topicName as string,
            }),
        queryKey: queryKeys.topicMessages(topicName ?? ''),
        sseUrl: () => (topicName ? sseUrl(topicName) : null),
    });

    const waitingForPrerequisites = useBoundedPending(!enabled);
    const loading = enabled ? query.isLoading : waitingForPrerequisites;

    return {
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        loading,
        messages: query.data?.pages.flatMap((page) => page.data) ?? [],
    };
}
