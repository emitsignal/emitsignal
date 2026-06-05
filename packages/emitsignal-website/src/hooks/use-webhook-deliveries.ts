import { useCallback, useEffect, useMemo, useState } from 'react';

import type { WebhookDelivery } from '#/lib/api';

import { useSession } from '#/ctx/session';
import { api, sseUrl } from '#/lib/api';

import { useSSE } from './use-sse';

export function useWebhookDeliveries(webhookId: string, topicName?: string) {
    const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
    const [error, setError] = useState<null | string>(null);
    const [loading, setLoading] = useState(true);
    const { loading: authLoading, token } = useSession();

    const authHeaders = useMemo(
        () => (token ? { Authorization: `Bearer ${token}` } : undefined),
        [token],
    );

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        api.listWebhookDeliveries(webhookId)
            .then(setDeliveries)
            .catch((error) =>
                error instanceof Error ? error.message : 'Failed to load deliveries',
            )
            .finally(() => setLoading(false));
    }, [webhookId]);

    // Re-fetches without touching loading state so the UI doesn't flash on live updates.
    const silentLoad = useCallback(() => {
        api.listWebhookDeliveries(webhookId)
            .then(setDeliveries)
            .catch(() => null);
    }, [webhookId]);

    useEffect(() => {
        void load();
    }, [load]);

    useSSE({
        headers: authHeaders,
        onEvent: (event) => {
            if (event !== 'message') {
                return;
            }

            void silentLoad();
        },
        url: !authLoading && topicName ? sseUrl(topicName) : null,
    });

    return { deliveries, error, loading, refresh: load };
}
