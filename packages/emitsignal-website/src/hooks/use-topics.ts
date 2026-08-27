import type { AccessMode } from '@emitsignal/shared';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '#/lib/api';
import { queryKeys } from '#/lib/query-client';

export function useClaimTopic() {
    const invalidate = useTopicOwnershipInvalidation();

    return useMutation({
        mutationFn: ({ accessMode, name }: { accessMode?: AccessMode; name: string }) =>
            api.claimTopic(name, accessMode ? { accessMode } : undefined),
        onSuccess: invalidate,
    });
}

export function useReleaseTopic() {
    const invalidate = useTopicOwnershipInvalidation();

    return useMutation({
        mutationFn: (name: string) => api.releaseTopic(name),
        onSuccess: invalidate,
    });
}

export function useTopics(query?: string) {
    const { data, error, isPending } = useQuery({
        // Keep the previous results visible while typing so the list doesn't flash.
        placeholderData: keepPreviousData,
        queryFn: () => api.listTopics(query),
        queryKey: queryKeys.topics(query ?? ''),
    });

    return {
        error: error instanceof Error ? error : null,
        loading: isPending,
        topics: data ?? [],
    };
}

export function useUpdateTopic() {
    const invalidate = useTopicOwnershipInvalidation();

    return useMutation({
        mutationFn: ({
            input,
            name,
        }: {
            input: { accessMode?: AccessMode; description?: string; displayName?: string };
            name: string;
        }) => api.updateTopic(name, input),
        onSuccess: invalidate,
    });
}

function useTopicOwnershipInvalidation() {
    const queryClient = useQueryClient();

    return async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
            queryClient.invalidateQueries({ queryKey: ['topics'] }),
            queryClient.invalidateQueries({ queryKey: queryKeys.billing }),
        ]);
    };
}
