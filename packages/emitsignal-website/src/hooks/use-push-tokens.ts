import type { PushToken } from '@emitsignal/shared/api';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '#/lib/api';
import { apiErrorMessage } from '#/lib/api-error';
import { queryKeys } from '#/lib/query-client';

export function usePushTokens() {
    const queryClient = useQueryClient();

    const { data, error, isPending } = useQuery({
        queryFn: () => api.listMyPushTokens(),
        queryKey: queryKeys.pushTokens,
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, pushEnabled }: { id: string; pushEnabled: boolean }) =>
            api.updatePushToken(id, pushEnabled),
        onSuccess: (updated) => {
            queryClient.setQueryData<PushToken[]>(queryKeys.pushTokens, (previous) =>
                (previous ?? []).map((token) => (token.id === updated.id ? updated : token)),
            );
        },
    });

    const removeMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.deletePushToken(id);

            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<PushToken[]>(queryKeys.pushTokens, (previous) =>
                (previous ?? []).filter((token) => token.id !== id),
            );
        },
    });

    const mutationError = toggleMutation.error ?? removeMutation.error;

    return {
        error: error
            ? apiErrorMessage(error, 'Failed to load devices')
            : mutationError
              ? apiErrorMessage(mutationError, 'Failed to update device')
              : null,
        loading: isPending,
        remove: (id: string) => removeMutation.mutate(id),
        removingId: removeMutation.isPending ? removeMutation.variables : null,
        toggle: (id: string, pushEnabled: boolean) => toggleMutation.mutate({ id, pushEnabled }),
        togglingId: toggleMutation.isPending ? toggleMutation.variables.id : null,
        tokens: data ?? [],
    };
}
