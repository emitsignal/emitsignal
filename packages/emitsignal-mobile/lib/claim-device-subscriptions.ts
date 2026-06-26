import { api, setAuthToken } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { queryClient, queryKeys } from '@/lib/query-client';

interface ClaimAuth {
    token?: null | string;
    userId?: null | string;
}

/**
 * Adopt this device's anonymous subscriptions into the just-signed-in account.
 *
 * Called from the sign-in handlers (the only genuine anonymous → account
 * transition), so it runs once per sign-in instead of on every app launch.
 *
 * The SessionProvider effect that normally syncs the bearer token to the API
 * client hasn't run yet at this point, so callers pass the token + userId from
 * the sign-in response and we prime the token before calling the authenticated
 * claim endpoint. If either is missing we fall back to reading the established
 * session ourselves.
 */
export async function claimDeviceSubscriptions(
    deviceId: null | string,
    auth: ClaimAuth = {},
): Promise<void> {
    if (!deviceId) {
        return;
    }

    let { token, userId } = auth;

    if (!token || !userId) {
        const { data } = await authClient.getSession({ query: { disableCookieCache: true } });

        token = token ?? data?.session?.token;
        userId = userId ?? data?.user?.id;
    }

    if (!token || !userId) {
        return;
    }

    setAuthToken(token);

    const { claimed } = await api.claimSubscriptions(deviceId).catch(() => ({ claimed: 0 }));

    if (claimed > 0) {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions(userId) });
    }
}
