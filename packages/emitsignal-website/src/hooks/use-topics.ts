import { useEffect, useState } from 'react';

import type { Topic } from '#/lib/api';

import { api } from '#/lib/api';

export function useTopics(query?: string) {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        api.listTopics(query)
            .then((data) => {
                if (!cancelled) {
                    setTopics(data);
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
    }, [query]);

    return { error, loading, topics };
}
