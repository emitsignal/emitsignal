import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import type { Subscription } from '#/lib/api';

import { useSession } from '#/ctx/session';
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
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

    const { loading: authLoading, user } = useSession();
    const userId = user?.id;
    const deviceId = getDeviceId();

    const refresh = useCallback(async () => {
        try {
            const fetchedSubscriptions = await api.listSubscriptions(userId ? undefined : deviceId);

            setSubscriptions(fetchedSubscriptions);
            setError(null);
        } catch (error) {
            setError(error instanceof Error ? error : new Error(String(error)));
        } finally {
            setLoading(false);
        }
    }, [userId, deviceId]);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        refresh();
    }, [authLoading, refresh]);

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
        <SubscriptionsContext.Provider
            value={{ error, loading, subscribe, subscriptions, unsubscribe }}
        >
            {children}
        </SubscriptionsContext.Provider>
    );
}

export function useSubscriptions() {
    const context = useContext(SubscriptionsContext);

    if (!context) {
        throw new Error('useSubscriptions must be used within SubscriptionsProvider');
    }

    return context;
}
