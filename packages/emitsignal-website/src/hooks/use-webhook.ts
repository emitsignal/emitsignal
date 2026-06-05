import { useCallback, useEffect, useState } from 'react';

import type { Webhook } from '#/lib/api';

import { api } from '#/lib/api';

export function useWebhook(id: string) {
    const [webhook, setWebhook] = useState<null | Webhook>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<null | string>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getWebhook(id);
            setWebhook(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load webhook');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void load();
    }, [load]);

    return { error, loading, refresh: load, webhook };
}
