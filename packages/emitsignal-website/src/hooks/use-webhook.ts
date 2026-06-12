import { useQuery } from '@tanstack/react-query';

import { api } from '#/lib/api';
import { queryKeys } from '#/lib/query-client';

export function useWebhook(id: string) {
    const { data, error, isPending, refetch } = useQuery({
        enabled: Boolean(id),
        queryFn: () => api.getWebhook(id),
        queryKey: queryKeys.webhook(id),
    });

    return {
        error: error instanceof Error ? error.message : null,
        loading: isPending,
        refresh: () => refetch(),
        webhook: data ?? null,
    };
}
