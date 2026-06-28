import { useQuery } from '@tanstack/react-query';

import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { api, type SubscriptionMetricsMap } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

const EMPTY_METRICS: SubscriptionMetricsMap = {};

/**
 * 24h activity metrics for the user's subscribed topics, keyed by topic id.
 * Fetched independently of the subscription list
 * it never blocks or invalidates the list.
 *
 * Gated behind `enabled` (the "Show subscription metrics" debug opt-in): when
 * off, no request is ever made, saving API/DB resources for users who don't
 * surface the sparkline. No background polling — the data is refreshed on
 * pull-to-refresh and kept stale for 180s so rapid refreshes don't abuse the API.
 */
export function useSubscriptionMetrics(enabled = true) {
    const { loading: sessionLoading, user } = useSession();
    const { deviceId } = useDevice();

    const userId = user?.id;
    const scope = userId ?? deviceId ?? '';
    const queryEnabled = enabled && !sessionLoading && Boolean(userId || deviceId);

    const { data, refetch } = useQuery({
        enabled: queryEnabled,
        queryFn: () => api.listSubscriptionMetrics(userId ? undefined : (deviceId ?? undefined)),
        queryKey: queryKeys.subscriptionMetrics(scope),
        staleTime: 180_000,
    });

    return { metrics: data ?? EMPTY_METRICS, refresh: () => refetch() };
}
