import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Webhook } from '#/lib/api';

import { useSession } from '#/ctx/session';
import { api, sseMultiUrl } from '#/lib/api';

import { useSSE } from './use-sse';

export function useWebhooks() {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<null | string>(null);

    const { loading: authLoading } = useSession();

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.listWebhooks();
            setWebhooks(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load webhooks');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const remove = useCallback(async (id: string) => {
        await api.deleteWebhook(id);
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
    }, []);

    const update = useCallback(
        async (id: string, input: Parameters<typeof api.updateWebhook>[1]) => {
            const updated = await api.updateWebhook(id, input);
            setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)));
            return updated;
        },
        [],
    );

    const topicNames = useMemo(() => [...new Set(webhooks.map((w) => w.topicName))], [webhooks]);

    useSSE({
        onEvent: (event, data) => {
            if (event !== 'message') {
                return;
            }

            const { topicName } = data as { topicName?: string };

            if (!topicName) {
                return;
            }

            setWebhooks((prevWebHooks) =>
                prevWebHooks.map((webhook) =>
                    webhook.topicName === topicName
                        ? {
                              ...webhook,
                              count24h: webhook.count24h + 1,
                              lastDeliveryAt: Math.floor(Date.now() / 1000),
                          }
                        : webhook,
                ),
            );
        },
        url: !authLoading && topicNames.length > 0 ? sseMultiUrl(topicNames) : null,
    });

    return { error, loading, refresh: load, remove, update, webhooks };
}
