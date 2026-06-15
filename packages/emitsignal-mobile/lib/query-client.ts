import { QueryClient } from '@tanstack/react-query';

/**
 * Query key conventions (mirrors the website package). Array keys grouped by
 * domain so related queries can be invalidated together. scope = userId ?? deviceId.
 *
 *   ['billing']                   → api.getBilling()
 *   ['feed', scope]               → api.listSubscriptionMessages()
 *   ['message', id]               → api.getMessage(id)
 *   ['push-tokens']               → api.listMyPushTokens()
 *   ['subscriptions', scope]      → api.listSubscriptions()
 *   ['topic-messages', name]      → api.listMessages(name)
 *   ['topic-suggestions', device] → api.getSuggestions(device)
 *   ['topics', query]             → api.listTopics(query)
 */
export const queryKeys = {
    billing: ['billing'] as const,
    feed: (scope: string) => ['feed', scope] as const,
    message: (id: string) => ['message', id] as const,
    pushTokens: ['push-tokens'] as const,
    subscriptions: (scope: string) => ['subscriptions', scope] as const,
    topicMessages: (topicName: string) => ['topic-messages', topicName] as const,
    topics: (query: string) => ['topics', query] as const,
    topicSuggestions: (deviceId: string) => ['topic-suggestions', deviceId] as const,
};

export function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                gcTime: 5 * 60_000,
                retry: 1,
                staleTime: 30_000,
            },
        },
    });
}

export const queryClient = makeQueryClient();
