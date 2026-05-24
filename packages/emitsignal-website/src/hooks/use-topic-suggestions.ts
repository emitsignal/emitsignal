import { useEffect, useState } from 'react';

import type { TopicSuggestion } from '#/lib/api';

import { api } from '#/lib/api';
import { getDeviceId } from '#/lib/storage';

export function useTopicSuggestions() {
    const [data, setData] = useState<TopicSuggestion[]>([]);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const deviceId = getDeviceId();

        api.getSuggestions(deviceId)
            .then((suggestions) => {
                if (!cancelled) {
                    setData(suggestions);
                    setLoading(false);
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    setError(error instanceof Error ? error : new Error(String(error)));
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { data, error, loading };
}
