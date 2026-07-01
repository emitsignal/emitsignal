import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import type { Message, MessageFilterParams, TopicMetrics } from '#/lib/api';

import { useSession } from '#/ctx/session';
import { useSubscriptions } from '#/ctx/subscriptions';
import { api, matchesMessageFilter, sseMultiUrl, sseUrl } from '#/lib/api';
import { queryKeys } from '#/lib/query-client';
import { getDeviceId } from '#/lib/storage';

import { useLiveQuery } from './use-live-query';

export function useFeed() {
    const deviceId = getDeviceId();
    const { loading: authLoading, user } = useSession();
    const { subscriptions } = useSubscriptions();

    const userId = user?.id;
    const scope = userId ?? deviceId;
    const topicNames = subscriptions.map((subscription) => subscription.topic.name);

    const query = useLiveQuery<Message[]>({
        enabled: !authLoading,
        onMessage: (queryClient, data) => {
            const incoming = data as { topicName?: string } & Message;

            queryClient.setQueryData<Message[]>(queryKeys.feed(scope), (previous = []) => {
                if (previous.some((message) => message.id === incoming.id)) {
                    return previous;
                }

                return [incoming, ...previous].slice(0, 200);
            });
        },
        queryFn: async () => {
            const result = await api.listSubscriptionMessages(deviceId, { limit: 50 });

            return result.data;
        },
        queryKey: queryKeys.feed(scope),
        sseUrl: () => (topicNames.length ? sseMultiUrl(topicNames) : null),
    });

    return {
        error: query.error instanceof Error ? query.error : null,
        loading: query.isPending,
        messages: query.data ?? [],
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

    const query = useLiveQuery<Message[]>({
        enabled: Boolean(topicName),
        onMessage: (queryClient, data) => {
            if (!topicName) {
                return;
            }

            const incoming = data as Message;

            // Metrics stay global/unfiltered — they reflect the whole topic.
            onNewMessageRef.current?.(incoming);

            if (!matchesMessageFilter(incoming, filtersRef.current)) {
                return;
            }

            const key = queryKeys.topicMessages(topicName, filtersRef.current);
            const current = queryClient.getQueryData<Message[]>(key) ?? [];

            if (current.some((message) => message.id === incoming.id)) {
                return;
            }

            queryClient.setQueryData<Message[]>(key, [incoming, ...current]);
        },
        queryFn: async () => {
            const result = await api.listSubscriptionMessages(deviceId, {
                limit: 50,
                minPriority: filters?.minPriority,
                tags: filters?.tags,
                topicName: topicName as string,
            });
            return result.data;
        },
        queryKey: queryKeys.topicMessages(topicName ?? '', filters),
        sseUrl: () => (topicName ? sseUrl(topicName) : null),
    });

    return { loading: query.isPending, messages: query.data ?? [] };
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
