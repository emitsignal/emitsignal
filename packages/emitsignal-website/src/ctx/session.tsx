import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { api, setAuthToken } from '#/lib/api';
import { getSession, removeSession, setSession } from '#/lib/storage';

interface SessionContextValue {
    loading: boolean;
    signIn: (token: string, user: SessionUser) => Promise<void>;
    signOut: () => Promise<void>;
    token: null | string;
    user: null | SessionUser;
}

interface SessionUser {
    email: string;
    id: string;
    name: null | string;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<null | string>(null);
    const [user, setUser] = useState<null | SessionUser>(null);

    useEffect(() => {
        let cancelled = false;

        const stored = getSession();

        if (!stored) {
            setLoading(false);
            return;
        }

        setAuthToken(stored.token);

        api.me()
            .then(() => {
                if (cancelled) return;
                setToken(stored.token);
                setUser(stored.user);
            })
            .catch(() => {
                removeSession();
                setAuthToken(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const signIn = async (newToken: string, newUser: SessionUser) => {
        setSession(newToken, newUser);
        setToken(newToken);
        setUser(newUser);
        setAuthToken(newToken);
    };

    const signOut = async () => {
        removeSession();
        setToken(null);
        setUser(null);
        setAuthToken(null);
    };

    return (
        <SessionContext.Provider value={{ loading, signIn, signOut, token, user }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);

    if (!context) {
        throw new Error('useSession must be used within SessionProvider');
    }

    return context;
}
