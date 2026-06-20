import { createIsomorphicFn } from '@tanstack/react-start';

import { authClient } from '#/lib/auth-client';
import { hasAuthCookie } from '#/lib/auth.server';

export const isAuthenticated = createIsomorphicFn()
    .server(() => hasAuthCookie())
    .client(async () => {
        const cached = authClient.$store.atoms['session'].get();

        if (cached.data?.user) {
            return true;
        }

        const { data } = await authClient.getSession();

        return !!data?.user;
    });
