import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext } from 'react';

import type { Subscription } from '#/lib/api';

import { useSession } from '#/ctx/session';
import { api } from '#/lib/api';
import { queryKeys } from '#/lib/query-client';
import { getDeviceId } from '#/lib/storage';

interface SubscriptionsContextValue {
    error: Error | null;
    loading: boolean;
    subscribe: (topicName: string) => Promise<void>;
    subscriptions: Subscription[];
    unsubscribe: (topicName: string) => Promise<void>;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | undefined>(undefined);

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { loading: authLoading, user } = useSession();
    const deviceId = getDeviceId();
    const scope = user?.id ?? deviceId;

    const { data, error, isPending } = useQuery({
        enabled: !authLoading,
        queryFn: () => api.listSubscriptions(user?.id ? undefined : deviceId),
        queryKey: queryKeys.subscriptions(scope),
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions(scope) });

    const subscribeMutation = useMutation({
        mutationFn: (topicName: string) => api.subscribe(deviceId, topicName),
        onSuccess: invalidate,
    });

    const unsubscribeMutation = useMutation({
        mutationFn: (topicName: string) => api.unsubscribe(deviceId, topicName),
        onSuccess: invalidate,
    });

    const value: SubscriptionsContextValue = {
        error: error instanceof Error ? error : null,
        loading: authLoading || isPending,
        subscribe: async (topicName) => {
            await subscribeMutation.mutateAsync(topicName);
        },
        subscriptions: data ?? [],
        unsubscribe: async (topicName) => {
            await unsubscribeMutation.mutateAsync(topicName);
        },
    };

    return <SubscriptionsContext.Provider value={value}>{children}</SubscriptionsContext.Provider>;
}

export function useSubscriptions() {
    const context = useContext(SubscriptionsContext);

    if (!context) {
        throw new Error('useSubscriptions must be used within SubscriptionsProvider');
    }

    return context;
}
