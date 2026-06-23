import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { api, type Message, sseMultiUrl, sseUrl } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

import { useBoundedPending } from './use-bounded-pending';
import { useLiveQuery } from './use-live-query';
import { useSubscriptions } from './use-subscriptions';

export function useFeed() {
    const { deviceId } = useDevice();
    const { loading: sessionLoading, user } = useSession();
    const { subscriptions } = useSubscriptions();

    const userId = user?.id;
    const scope = userId ?? deviceId ?? '';
    const topicNames = subscriptions.map((subscription) => subscription.topic.name);

    const enabled = !sessionLoading && Boolean(userId || deviceId);

    const query = useLiveQuery<Message[]>({
        enabled,
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

    // A disabled query reports `status: 'pending'`; only treat the screen as
    // loading while it actually fetches, or while prerequisites resolve.
    const waitingForPrerequisites = useBoundedPending(!enabled);
    const loading = enabled ? query.isLoading : waitingForPrerequisites;

    return {
        error: query.error instanceof Error ? query.error : null,
        loading,
        messages: query.data ?? [],
        refresh: () => query.refetch(),
        refreshing: query.isFetching,
        subscriptions,
    };
}

export function useTopicMessages(topicName: null | string) {
    const { deviceId } = useDevice();
    const { user } = useSession();

    const enabled = Boolean(topicName);

    const query = useLiveQuery<Message[]>({
        enabled,
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
        queryFn: () =>
            api.listSubscriptionMessages(
                user?.id ? undefined : (deviceId ?? undefined),
                50,
                topicName as string,
            ),
        queryKey: queryKeys.topicMessages(topicName ?? ''),
        sseUrl: () => (topicName ? sseUrl(topicName) : null),
    });

    const waitingForPrerequisites = useBoundedPending(!enabled);
    const loading = enabled ? query.isLoading : waitingForPrerequisites;

    return { loading, messages: query.data ?? [] };
}
