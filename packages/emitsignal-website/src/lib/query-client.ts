import { QueryClient } from '@tanstack/react-query';

import { authClient } from '#/lib/auth-client';

/**
 * Query key conventions
 * ----------------------
 * Use array keys grouped by domain so related queries can be invalidated
 * together. Keep this list as the single source of truth as more data is
 * migrated onto TanStack Query.
 *
 *   ['api-keys']                  → authClient.apiKey.list()
 *   ['auth', 'accounts']          → authClient.listAccounts()
 *   ['auth', 'passkeys']          → authClient.passkey.listUserPasskeys()
 *   ['auth', 'sessions']          → authClient.listSessions()
 *   ['billing']                   → api.getBilling()
 *   ['feed', scope]               → api.listSubscriptionMessages()
 *   ['session']                   → authClient.getSession()
 *   ['subscriptions', scope]      → api.listSubscriptions()    (scope = userId ?? deviceId)
 *   ['topic-messages', name]      → api.listMessages(name)
 *   ['topic-metrics', name]       → api.getTopicMetrics(name)
 *   ['topic-suggestions', device] → api.getSuggestions(device)
 *   ['topics', query]             → api.listTopics(query)
 *   ['webhook-deliveries', id]    → api.listWebhookDeliveries(id)
 *   ['webhook', id]               → api.getWebhook(id)
 *   ['webhooks']                  → api.listWebhooks()
 */
export const queryKeys = {
    apiKeys: ['api-keys'] as const,
    authAccounts: ['auth', 'accounts'] as const,
    authPasskeys: ['auth', 'passkeys'] as const,
    authSessions: ['auth', 'sessions'] as const,
    billing: ['billing'] as const,
    feed: (scope: string) => ['feed', scope] as const,
    session: ['session'] as const,
    subscriptions: (scope: string) => ['subscriptions', scope] as const,
    topicMessages: (topicName: string) => ['topic-messages', topicName] as const,
    topicMetrics: (topicName: string) => ['topic-metrics', topicName] as const,
    topics: (query: string) => ['topics', query] as const,
    topicSuggestions: (deviceId: string) => ['topic-suggestions', deviceId] as const,
    webhook: (id: string) => ['webhook', id] as const,
    webhookDeliveries: (id: string) => ['webhook-deliveries', id] as const,
    webhooks: ['webhooks'] as const,
};

// Single source of truth for reading the session through TanStack Query. Used
// by the `/app` and `/sign-in` route guards and the `useSession` hook so every
// caller resolves auth state from the same cache entry — preventing the guards
// from disagreeing and bouncing the user in a redirect loop.
export const sessionQueryOptions = {
    queryFn: () => authClient.getSession().then((result) => result.data),
    queryKey: queryKeys.session,
    staleTime: 5 * 60_000,
} as const;

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
