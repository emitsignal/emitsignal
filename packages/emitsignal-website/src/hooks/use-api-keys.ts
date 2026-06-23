import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authClient } from '#/lib/auth-client';
import { queryKeys } from '#/lib/query-client';

export interface ApiKey {
    createdAt: Date;
    enabled: boolean;
    expiresAt: Date | null;
    id: string;
    lastRequest: Date | null;
    name: null | string;
    prefix: null | string;
    requestCount: number;
    start: null | string;
}

export function useApiKeys() {
    const queryClient = useQueryClient();

    const { data, error, isPending } = useQuery({
        queryFn: fetchApiKeys,
        queryKey: queryKeys.apiKeys,
        staleTime: 5 * 60_000,
    });

    const disableMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error: apiError } = await authClient.apiKey.update({
                enabled: false,
                keyId: id,
            });

            if (apiError) {
                throw new Error(apiError.message);
            }

            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<ApiKey[]>(queryKeys.apiKeys, (previous) =>
                (previous ?? []).map((apiKey) =>
                    apiKey.id === id ? { ...apiKey, enabled: false } : apiKey,
                ),
            );
        },
    });

    const removeMutation = useMutation({
        mutationFn: async (id: string) => {
            await authClient.apiKey.delete({ keyId: id });

            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData<ApiKey[]>(queryKeys.apiKeys, (previous) =>
                (previous ?? []).filter((apiKey) => apiKey.id !== id),
            );
        },
    });

    return {
        apiKeys: data ?? [],
        disable: (id: string) => disableMutation.mutateAsync(id),
        error: error instanceof Error ? error.message : null,
        loading: isPending,
        refresh: () => queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys }),
        remove: (id: string) => removeMutation.mutateAsync(id),
    };
}

async function fetchApiKeys(): Promise<ApiKey[]> {
    const { data, error: apiError } = await authClient.apiKey.list();

    if (apiError) {
        throw new Error(apiError.message);
    }

    return (data as unknown as { apiKeys: ApiKey[] })?.apiKeys ?? [];
}
