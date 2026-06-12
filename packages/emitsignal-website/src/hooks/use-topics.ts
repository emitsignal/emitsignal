import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '#/lib/api';
import { queryKeys } from '#/lib/query-client';

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
