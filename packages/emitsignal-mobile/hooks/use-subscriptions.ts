import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

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
        mutationFn: (topicName: string) => api.subscribe(deviceId ?? '', topicName, true),
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
        subscribe: (topicName: string) => subscribeMutation.mutateAsync(topicName),
        subscriptions: data ?? [],
        unsubscribe: (topicName: string) => unsubscribeMutation.mutateAsync(topicName),
    };
}
