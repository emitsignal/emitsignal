import { useCallback, useEffect, useState } from 'react';

import type { Subscription } from '#/lib/api';

import { useSession } from '#/ctx/session';
import { api } from '#/lib/api';
import { getDeviceId } from '#/lib/storage';

interface SubscriptionsState {
    error: Error | null;
    loading: boolean;
    subscriptions: Subscription[];
}

export function useSubscriptions() {
    const [state, setState] = useState<SubscriptionsState>({
        error: null,
        loading: true,
        subscriptions: [],
    });

    const { user } = useSession();
    const userId = user?.id;
    const deviceId = getDeviceId();

    const refresh = useCallback(async () => {
        try {
            const subscriptions = await api.listSubscriptions(userId ? undefined : deviceId);
            setState({ error: null, loading: false, subscriptions });
        } catch (error) {
            setState((previous) => ({
                ...previous,
                error: error instanceof Error ? error : new Error(String(error)),
                loading: false,
            }));
        }
    }, [userId, deviceId]);

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

    return { ...state, refresh, subscribe, unsubscribe };
}
