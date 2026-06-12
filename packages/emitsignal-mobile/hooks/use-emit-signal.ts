import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { api, type Message, sseMultiUrl, sseUrl } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

import { useLiveQuery } from './use-live-query';
import { useSubscriptions } from './use-subscriptions';

export function useFeed() {
    const { deviceId } = useDevice();
    const { loading: sessionLoading, user } = useSession();
    const { subscriptions } = useSubscriptions();

    const userId = user?.id;
    const scope = userId ?? deviceId ?? '';
    const topicNames = subscriptions.map((subscription) => subscription.topic.name);

    const query = useLiveQuery<Message[]>({
        enabled: !sessionLoading && Boolean(userId || deviceId),
        onMessage: (queryClient, data) => {
            const incoming = data as { topicName?: string } & Message;

            queryClient.setQueryData<Message[]>(queryKeys.feed(scope), (previous = []) => {
                if (previous.some((message) => message.id === incoming.id)) {
                    return previous;
                }

                return [incoming, ...previous].slice(0, 200);
            });
        },
        queryFn: () =>
            api.listSubscriptionMessages(userId ? undefined : (deviceId ?? undefined), 50),
        queryKey: queryKeys.feed(scope),
        sseUrl: () => (topicNames.length ? sseMultiUrl(topicNames) : null),
    });

    return {
        error: query.error instanceof Error ? query.error : null,
        loading: query.isPending,
        messages: query.data ?? [],
        refresh: () => query.refetch(),
        refreshing: query.isFetching,
        subscriptions,
    };
}

export function useTopicMessages(topicName: null | string) {
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
        },
        queryFn: () => api.listMessages(topicName as string),
        queryKey: queryKeys.topicMessages(topicName ?? ''),
        sseUrl: () => (topicName ? sseUrl(topicName) : null),
    });

    return { loading: query.isPending, messages: query.data ?? [] };
}
