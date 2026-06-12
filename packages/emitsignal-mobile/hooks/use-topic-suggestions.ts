import { useQuery } from '@tanstack/react-query';

import { api, type TopicSuggestion } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

interface SuggestionsState {
    data: null | TopicSuggestion[];
    error: Error | null;
    isLoading: boolean;
}

export function useTopicSuggestions(deviceId?: null | string): SuggestionsState {
    const { data, error, isPending } = useQuery({
        queryFn: () => api.getSuggestions(deviceId ?? undefined),
        queryKey: queryKeys.topicSuggestions(deviceId ?? ''),
    });

    return {
        data: data ?? null,
        error: error instanceof Error ? error : null,
        isLoading: isPending,
    };
}
