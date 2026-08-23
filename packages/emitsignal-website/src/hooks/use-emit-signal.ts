import { type InfiniteData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import type { Message, MessageFilterParams, PaginatedResponse, TopicMetrics } from '#/lib/api';

import { useSession } from '#/ctx/session';
import { useSubscriptions } from '#/ctx/subscriptions';
import { api, matchesMessageFilter } from '#/lib/api';
import { queryKeys } from '#/lib/query-client';
import { getDeviceId } from '#/lib/storage';

import { useLiveInfiniteQuery } from './use-live-infinite-query';

export function useFeed() {
    const deviceId = getDeviceId();
    const { loading: authLoading, user } = useSession();
    const { subscriptions } = useSubscriptions();

    const userId = user?.id;
    const scope = userId ?? deviceId;
    const subscriptionTopicNames = subscriptions.map((subscription) => subscription.topic.name);

    const query = useLiveInfiniteQuery<Message>({
        enabled: !authLoading,
        onMessage: (queryClient, message, queryKey) => {
            queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
                queryKey,
                (previous) => {
                    if (!previous) {
                        return previous;
                    }

                    const firstPage = previous.pages[0];

                    if (!firstPage || firstPage.data.some((m) => m.id === message.id)) {
                        return previous;
                    }

                    return {
                        ...previous,
                        pages: [
                            { ...firstPage, data: [message, ...firstPage.data] },
                            ...previous.pages.slice(1),
                        ],
                    };
                },
            );
        },
        queryFn: (cursor) => api.listSubscriptionMessages(deviceId, { cursor, limit: 50 }),
        queryKey: queryKeys.feed(scope),
        topicNames: () => subscriptionTopicNames,
    });

    return {
        error: query.error instanceof Error ? query.error : null,
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        loading: query.isPending,
        messages: query.data?.pages.flatMap((page) => page.data) ?? [],
        refresh: () => query.refetch(),
        subscriptions,
    };
}

export function useTopicMessages(
    topicName: null | string,
    onNewMessage?: (message: Message) => void,
    filters?: MessageFilterParams,
) {
    const onNewMessageRef = useRef(onNewMessage);
    onNewMessageRef.current = onNewMessage;

    const filtersRef = useRef(filters);
    filtersRef.current = filters;

    const deviceId = getDeviceId();

    const query = useLiveInfiniteQuery<Message>({
        enabled: Boolean(topicName),
        onMessage: (queryClient, message, queryKey) => {
            if (!topicName) {
                return;
            }

            onNewMessageRef.current?.(message);

            if (!matchesMessageFilter(message, filtersRef.current)) {
                return;
            }

            queryClient.setQueryData<InfiniteData<PaginatedResponse<Message>>>(
                queryKey,
                (previous) => {
                    if (!previous) {
                        return previous;
                    }

                    const firstPage = previous.pages[0];

                    if (!firstPage || firstPage.data.some((m) => m.id === message.id)) {
                        return previous;
                    }

                    return {
                        ...previous,
                        pages: [
                            { ...firstPage, data: [message, ...firstPage.data] },
                            ...previous.pages.slice(1),
                        ],
                    };
                },
            );
        },
        queryFn: (cursor) =>
            api.listSubscriptionMessages(deviceId, {
                cursor,
                limit: 50,
                minPriority: filtersRef.current?.minPriority,
                tags: filtersRef.current?.tags,
                topicName: topicName as string,
            }),
        queryKey: queryKeys.topicMessages(topicName ?? '', filters),
        topicNames: () => (topicName ? [topicName] : []),
    });

    return {
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        loading: query.isPending,
        messages: query.data?.pages.flatMap((page) => page.data) ?? [],
    };
}

export function useTopicMetrics(topicName: null | string) {
    const queryClient = useQueryClient();

    const { data, isPending } = useQuery({
        enabled: Boolean(topicName),
        queryFn: () => api.getTopicMetrics(topicName as string),
        queryKey: queryKeys.topicMetrics(topicName ?? ''),
    });

    const addMessage = useCallback(
        (message: Message) => {
            if (!topicName) {
                return;
            }

            queryClient.setQueryData<TopicMetrics>(
                queryKeys.topicMetrics(topicName),
                (previous) => {
                    if (!previous) {
                        return previous;
                    }

                    const volume = [...previous.volume];

                    volume[23]++;

                    return {
                        ...previous,
                        messageCount24h: previous.messageCount24h + 1,
                        p5Count24h: previous.p5Count24h + (message.priority === 5 ? 1 : 0),
                        volume,
                    };
                },
            );
        },
        [queryClient, topicName],
    );

    return { addMessage, loading: topicName ? isPending : false, metrics: data ?? null };
}
