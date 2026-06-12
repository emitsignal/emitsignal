import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Webhook } from '#/lib/api';

import { api, sseMultiUrl } from '#/lib/api';
import { queryKeys } from '#/lib/query-client';

import { useLiveQuery } from './use-live-query';

export function useWebhooks() {
    const queryClient = useQueryClient();

    const query = useLiveQuery<Webhook[]>({
        onMessage: (client, data) => {
            const { topicName } = data as { topicName?: string };

            if (!topicName) {
                return;
            }

            client.setQueryData<Webhook[]>(queryKeys.webhooks, (previous = []) =>
                previous.map((webhook) =>
                    webhook.topicName === topicName
                        ? {
                              ...webhook,
                              count24h: webhook.count24h + 1,
                              lastDeliveryAt: Math.floor(Date.now() / 1000),
                          }
                        : webhook,
                ),
            );
        },
        queryFn: () => api.listWebhooks(),
        queryKey: queryKeys.webhooks,
        sseUrl: (data) => {
            const topicNames = [...new Set((data ?? []).map((webhook) => webhook.topicName))];

            return topicNames.length > 0 ? sseMultiUrl(topicNames) : null;
        },
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.webhooks });

    const removeMutation = useMutation({
        mutationFn: (id: string) => api.deleteWebhook(id),
        onSuccess: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: (variables: { id: string; input: Parameters<typeof api.updateWebhook>[1] }) =>
            api.updateWebhook(variables.id, variables.input),
        onSuccess: invalidate,
    });

    return {
        error: query.error instanceof Error ? query.error.message : null,
        loading: query.isPending,
        refresh: () => query.refetch(),
        remove: (id: string) => removeMutation.mutateAsync(id),
        update: (id: string, input: Parameters<typeof api.updateWebhook>[1]) =>
            updateMutation.mutateAsync({ id, input }),
        webhooks: query.data ?? [],
    };
}
