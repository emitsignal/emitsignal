import { QueryClient } from '@tanstack/react-query';

/**
 * Query key conventions
 * ----------------------
 * Use array keys grouped by domain so related queries can be invalidated
 * together. Keep this list as the single source of truth as more data is
 * migrated onto TanStack Query.
 *
 *   ['api-keys']                  → authClient.apiKey.list()
 *   ['billing']                   → api.getBilling()
 *   ['auth', 'sessions']          → authClient.listSessions()
 *   ['auth', 'passkeys']          → authClient.passkey.listUserPasskeys()
 *   ['auth', 'accounts']          → authClient.listAccounts()
 *   ['subscriptions', scope]      → api.listSubscriptions()    (scope = userId ?? deviceId)
 *   ['feed', scope]               → api.listSubscriptionMessages()
 *   ['topic-messages', name]      → api.listMessages(name)
 *   ['topic-metrics', name]       → api.getTopicMetrics(name)
 *   ['webhooks']                  → api.listWebhooks()
 *   ['webhook', id]               → api.getWebhook(id)
 *   ['webhook-deliveries', id]    → api.listWebhookDeliveries(id)
 *   ['topics', query]             → api.listTopics(query)
 *   ['topic-suggestions', device] → api.getSuggestions(device)
 */
export const queryKeys = {
    apiKeys: ['api-keys'] as const,
    authAccounts: ['auth', 'accounts'] as const,
    authPasskeys: ['auth', 'passkeys'] as const,
    authSessions: ['auth', 'sessions'] as const,
    billing: ['billing'] as const,
    feed: (scope: string) => ['feed', scope] as const,
    subscriptions: (scope: string) => ['subscriptions', scope] as const,
    topicMessages: (topicName: string) => ['topic-messages', topicName] as const,
    topicMetrics: (topicName: string) => ['topic-metrics', topicName] as const,
    topics: (query: string) => ['topics', query] as const,
    topicSuggestions: (deviceId: string) => ['topic-suggestions', deviceId] as const,
    webhook: (id: string) => ['webhook', id] as const,
    webhookDeliveries: (id: string) => ['webhook-deliveries', id] as const,
    webhooks: ['webhooks'] as const,
};

export function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Data is considered fresh for 30s, so navigating back to a
                // page within that window reuses the cache instead of refetching.
                gcTime: 5 * 60_000,
                refetchOnWindowFocus: false,
                staleTime: 30_000,
            },
        },
    });
}
