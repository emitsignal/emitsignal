import { useCallback, useEffect, useState } from 'react';

import { authClient } from '#/lib/auth-client';

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
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [error, setError] = useState<null | string>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setError(null);
        setLoading(true);

        try {
            const { data, error: apiError } = await authClient.apiKey.list();

            if (apiError) {
                throw new Error(apiError.message);
            }

            setApiKeys((data as unknown as { apiKeys: ApiKey[] })?.apiKeys ?? []);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to load API keys');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const disable = useCallback(async (id: string) => {
        const { error: apiError } = await authClient.apiKey.update({ enabled: false, keyId: id });

        if (apiError) {
            throw new Error(apiError.message);
        }

        setApiKeys((prevApiKeys) =>
            prevApiKeys.map((apiKey) =>
                apiKey.id === id ? { ...apiKey, enabled: false } : apiKey,
            ),
        );
    }, []);

    const remove = useCallback(async (id: string) => {
        await authClient.apiKey.delete({ keyId: id });

        setApiKeys((prevApiKeys) => prevApiKeys.filter((apiKey) => apiKey.id !== id));
    }, []);

    return { apiKeys, disable, error, loading, refresh: load, remove };
}
