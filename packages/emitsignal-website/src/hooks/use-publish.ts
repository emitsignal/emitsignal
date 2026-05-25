import { useCallback, useState } from 'react';

import { api } from '#/lib/api';

interface PublishPayload {
    body: string;
    priority: number;
    tags: string[];
    title: string;
}

export function usePublish() {
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(false);

    const publish = useCallback(async (topicName: string, payload: PublishPayload) => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.publish(topicName, payload);

            setLoading(false);

            return result;
        } catch (error) {
            const wrappedError = error instanceof Error ? error : new Error(String(error));

            setError(wrappedError);
            setLoading(false);

            throw wrappedError;
        }
    }, []);

    return { error, loading, publish };
}
