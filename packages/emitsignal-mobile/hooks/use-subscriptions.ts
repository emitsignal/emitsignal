import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { api, type SubscriptionSettings } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

import { useBoundedPending } from './use-bounded-pending';

interface SubscribeOptions {
    pushEnabled?: boolean;
    settings?: Partial<SubscriptionSettings>;
}

export function useSubscriptions() {
    const queryClient = useQueryClient();
    const { loading: sessionLoading, user } = useSession();
    const { deviceId } = useDevice();

    const userId = user?.id;
    const scope = userId ?? deviceId ?? '';

    const enabled = !sessionLoading && Boolean(userId || deviceId);

    const { data, error, isFetching, isLoading, refetch } = useQuery({
        enabled,
        queryFn: () => api.listSubscriptions(userId ? undefined : (deviceId ?? undefined)),
        queryKey: queryKeys.subscriptions(scope),
    });

    // A disabled query reports `status: 'pending'`, so we must not treat it as
    // loading. While prerequisites (session/device) resolve, show a bounded
    // pending state; once enabled, defer to the query's real fetch state.

    const waitingForPrerequisites = useBoundedPending(!enabled);
    const loading = enabled ? isLoading : waitingForPrerequisites;

    // Subscribing/unsubscribing changes which topics feed the user, so the feed
    // must refetch to add or drop a channel's messages without a manual swipe-down refresh.
    const invalidateSubscriptionsAndFeed = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions(scope) }),
            queryClient.invalidateQueries({ queryKey: queryKeys.feed(scope) }),
        ]);
    };

    const subscribeMutation = useMutation({
        mutationFn: ({ options, topicName }: { options?: SubscribeOptions; topicName: string }) =>
            api.subscribe(
                deviceId ?? '',
                topicName,
                options?.pushEnabled ?? true,
                options?.settings,
            ),
        onSuccess: invalidateSubscriptionsAndFeed,
    });

    const updateSubscriptionMutation = useMutation({
        mutationFn: ({
            id,
            pushEnabled,
            settings,
        }: {
            id: string;
            pushEnabled?: boolean;
            settings?: Partial<SubscriptionSettings>;
        }) =>
            api.updateSubscription(id, {
                deviceId: deviceId ?? undefined,
                pushEnabled,
                settings,
            }),
        onSuccess: invalidateSubscriptionsAndFeed,
    });

    const unsubscribeMutation = useMutation({
        mutationFn: (topicName: string) => api.unsubscribe(deviceId ?? '', topicName),
        onSuccess: invalidateSubscriptionsAndFeed,
    });

    return {
        error: error instanceof Error ? error : null,
        loading,
        refresh: () => refetch(),
        refreshing: isFetching,
        subscribe: (topicName: string, options?: SubscribeOptions) =>
            subscribeMutation.mutateAsync({ options, topicName }),
        subscriptions: data ?? [],
        unsubscribe: (topicName: string) => unsubscribeMutation.mutateAsync(topicName),
        updateSubscription: (args: {
            id: string;
            pushEnabled?: boolean;
            settings?: Partial<SubscriptionSettings>;
        }) => updateSubscriptionMutation.mutateAsync(args),
    };
}
