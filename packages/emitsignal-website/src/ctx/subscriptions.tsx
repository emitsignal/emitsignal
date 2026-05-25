import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import type { Subscription } from '#/lib/api';

import { api } from '#/lib/api';
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
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const deviceId = getDeviceId();

    const refresh = useCallback(async () => {
        try {
            const subs = await api.listSubscriptions(deviceId);
            setSubscriptions(subs);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setLoading(false);
        }
    }, [deviceId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const subscribe = useCallback(
        async (topicName: string) => {
            await api.subscribe(deviceId, topicName);
            await refresh();
        },
        [deviceId, refresh],
    );

    const unsubscribe = useCallback(
        async (topicName: string) => {
            await api.unsubscribe(deviceId, topicName);
            await refresh();
        },
        [deviceId, refresh],
    );

    return (
        <SubscriptionsContext.Provider value={{ error, loading, subscribe, subscriptions, unsubscribe }}>
            {children}
        </SubscriptionsContext.Provider>
    );
}

export function useSubscriptions() {
    const ctx = useContext(SubscriptionsContext);

    if (!ctx) {
        throw new Error('useSubscriptions must be used within SubscriptionsProvider');
    }

    return ctx;
}
