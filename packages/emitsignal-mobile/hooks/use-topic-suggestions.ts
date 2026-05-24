import { useEffect, useState } from 'react';

import { api, type TopicSuggestion } from '@/lib/api';

interface SuggestionsState {
    data: null | TopicSuggestion[];
    error: Error | null;
    isLoading: boolean;
}

export function useTopicSuggestions(deviceId?: null | string): SuggestionsState {
    const [state, setState] = useState<SuggestionsState>({
        data: null,
        error: null,
        isLoading: true,
    });

    useEffect(() => {
        let cancelled = false;

        const fetchSuggestions = async () => {
            try {
                const data = await api.getSuggestions(deviceId ?? undefined);

                if (!cancelled) {
                    setState({ data, error: null, isLoading: false });
                }
            } catch (error) {
                if (!cancelled) {
                    setState({
                        data: null,
                        error: error instanceof Error ? error : new Error(String(error)),
                        isLoading: false,
                    });
                }
            }
        };

        void fetchSuggestions();

        return () => {
            cancelled = true;
        };
    }, [deviceId]);

    return state;
}
