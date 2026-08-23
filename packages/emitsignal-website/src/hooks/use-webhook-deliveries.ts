import type { WebhookDelivery } from '#/lib/api';

import { api } from '#/lib/api';
import { queryKeys } from '#/lib/query-client';

import { useLiveQuery } from './use-live-query';

export function useWebhookDeliveries(webhookId: string, topicName?: string) {
    const query = useLiveQuery<WebhookDelivery[]>({
        enabled: Boolean(webhookId),
        // A live delivery only tells us "something changed"; invalidate so the
        // list refetches in the background without a loading flash.
        onMessage: (queryClient) => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.webhookDeliveries(webhookId),
            });
        },
        queryFn: () => api.listWebhookDeliveries(webhookId),
        queryKey: queryKeys.webhookDeliveries(webhookId),
        topicNames: () => (topicName ? [topicName] : []),
    });

    return {
        deliveries: query.data ?? [],
        error: query.error instanceof Error ? query.error.message : null,
        loading: query.isPending,
        refresh: () => query.refetch(),
    };
}
