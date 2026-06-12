import { useQuery } from '@tanstack/react-query';

import { api } from '#/lib/api';
import { queryKeys } from '#/lib/query-client';
import { getDeviceId } from '#/lib/storage';

export function useTopicSuggestions() {
    const deviceId = getDeviceId();

    const { data, error, isPending } = useQuery({
        queryFn: () => api.getSuggestions(deviceId),
        queryKey: queryKeys.topicSuggestions(deviceId),
    });

    return {
        data: data ?? [],
        error: error instanceof Error ? error : null,
        loading: isPending,
    };
}
