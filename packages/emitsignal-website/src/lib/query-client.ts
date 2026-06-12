import { QueryClient } from '@tanstack/react-query';

/**
 * Query key conventions
 * ----------------------
 * Use array keys grouped by domain so related queries can be invalidated
 * together. Keep this list as the single source of truth as more data is
 * migrated onto TanStack Query.
 *
 *   ['api-keys']           → authClient.apiKey.list()
 *   ['auth', 'sessions']   → authClient.listSessions()
 *   ['auth', 'passkeys']   → authClient.passkey.listUserPasskeys()
 *   ['auth', 'accounts']   → authClient.listAccounts()
 */
export const queryKeys = {
    apiKeys: ['api-keys'] as const,
    authAccounts: ['auth', 'accounts'] as const,
    authPasskeys: ['auth', 'passkeys'] as const,
    authSessions: ['auth', 'sessions'] as const,
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
