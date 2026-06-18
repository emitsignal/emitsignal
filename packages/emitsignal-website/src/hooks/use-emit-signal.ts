import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import type { Message, TopicMetrics } from '#/lib/api';

import { useSession } from '#/ctx/session';
import { useSubscriptions } from '#/ctx/subscriptions';
import { api, sseMultiUrl, sseUrl } from '#/lib/api';
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
        queryFn: () => api.listSubscriptionMessages(userId ? undefined : deviceId, 50),
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
) {
    const onNewMessageRef = useRef(onNewMessage);
    onNewMessageRef.current = onNewMessage;

    const deviceId = getDeviceId();
    const { user } = useSession();

    const query = useLiveQuery<Message[]>({
        enabled: Boolean(topicName),
        onMessage: (queryClient, data) => {
            if (!topicName) {
                return;
            }

            const incoming = data as Message;
            const key = queryKeys.topicMessages(topicName);
            const current = queryClient.getQueryData<Message[]>(key) ?? [];

            if (current.some((message) => message.id === incoming.id)) {
                return;
            }

            queryClient.setQueryData<Message[]>(key, [incoming, ...current]);
            onNewMessageRef.current?.(incoming);
        },
        queryFn: () =>
            api.listSubscriptionMessages(user?.id ? undefined : deviceId, 50, topicName as string),
        queryKey: queryKeys.topicMessages(topicName ?? ''),
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
