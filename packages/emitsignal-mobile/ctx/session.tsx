import { createContext, type ReactNode, useContext, useEffect } from 'react';

import { setAuthToken } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

export interface SessionContextValue {
    loading: boolean;
    signOut: () => Promise<void>;
    user: null | SessionUser;
}

export interface SessionUser {
    email: string;
    id: string;
    image: null | string;
    name: null | string;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const { data, isPending } = authClient.useSession();

    useEffect(() => {
        if (data?.session?.token) {
            setAuthToken(data.session.token);
        } else if (!isPending) {
            setAuthToken(null);
        }
    }, [data?.session?.token, isPending]);

    const value: SessionContextValue = {
        loading: isPending,
        signOut: async () => {
            await authClient.signOut();
            setAuthToken(null);
        },
        user: data?.user
            ? {
                  email: data.user.email,
                  id: data.user.id,
                  image: data.user.image ?? null,
                  name: data.user.name ?? null,
              }
            : null,
    };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const ctx = useContext(SessionContext);

    if (!ctx) {
        throw new Error('useSession must be used within SessionProvider');
    }

    return ctx;
}
