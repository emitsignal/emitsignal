import { QueryClient } from '@tanstack/react-query';

/**
 * Query key conventions (mirrors the website package). Array keys grouped by
 * domain so related queries can be invalidated together. scope = userId ?? deviceId.
 *
 *   ['subscriptions', scope]      → api.listSubscriptions()
 *   ['feed', scope]               → api.listSubscriptionMessages()
 *   ['topic-messages', name]      → api.listMessages(name)
 *   ['topic-suggestions', device] → api.getSuggestions(device)
 *   ['topics', query]             → api.listTopics(query)
 *   ['push-tokens']               → api.listMyPushTokens()
 *   ['message', id]               → api.getMessage(id)
 */
export const queryKeys = {
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
