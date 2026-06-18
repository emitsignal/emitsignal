import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { api, type SubscriptionSettings } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

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

    const { data, error, isFetching, isPending, refetch } = useQuery({
        enabled: !sessionLoading && Boolean(userId || deviceId),
        queryFn: () => api.listSubscriptions(userId ? undefined : (deviceId ?? undefined)),
        queryKey: queryKeys.subscriptions(scope),
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions(scope) });

    const subscribeMutation = useMutation({
        mutationFn: ({ options, topicName }: { options?: SubscribeOptions; topicName: string }) =>
            api.subscribe(
                deviceId ?? '',
                topicName,
                options?.pushEnabled ?? true,
                options?.settings,
            ),
        onSuccess: invalidate,
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
        onSuccess: invalidate,
    });

    const unsubscribeMutation = useMutation({
        mutationFn: (topicName: string) => api.unsubscribe(deviceId ?? '', topicName),
        onSuccess: invalidate,
    });

    return {
        error: error instanceof Error ? error : null,
        loading: isPending,
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
