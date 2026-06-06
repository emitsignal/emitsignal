import type { ReactNode } from 'react';

import { authClient } from '#/lib/auth-client';

export interface SessionContextValue {
    loading: boolean;
    signOut: () => Promise<void>;
    user: null | SessionUser;
}

export interface SessionUser {
    email: string;
    id: string;
    name: null | string;
}

export function SessionProvider({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

export function useSession(): SessionContextValue {
    const { data, isPending } = authClient.useSession();

    return {
        loading: isPending,
        signOut: () => authClient.signOut().then(() => {}),
        user: data?.user
            ? {
                  email: data.user.email,
                  id: data.user.id,
                  name: data.user.name ?? null,
              }
            : null,
    };
}
