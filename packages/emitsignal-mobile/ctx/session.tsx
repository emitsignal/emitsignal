import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { api, setAuthToken } from '@/lib/api';

const SESSION_KEY = '@emitsignal/session';

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

        AsyncStorage.getItem(SESSION_KEY)
            .then(async (raw) => {
                if (cancelled || !raw) {
                    setLoading(false);

                    return;
                }

                try {
                    const parsed = JSON.parse(raw) as {
                        token: string;
                        user: SessionUser;
                    };

                    setAuthToken(parsed.token);

                    await api.me();

                    if (cancelled) {
                        return;
                    }

                    setToken(parsed.token);
                    setUser(parsed.user);
                } catch {
                    await AsyncStorage.removeItem(SESSION_KEY);
                    setAuthToken(null);
                } finally {
                    if (!cancelled) {
                        setLoading(false);
                    }
                }
            })
            .catch(() => {
                setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const signIn = async (newToken: string, newUser: SessionUser) => {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: newToken, user: newUser }));

        setToken(newToken);
        setUser(newUser);
        setAuthToken(newToken);
    };

    const signOut = async () => {
        await AsyncStorage.removeItem(SESSION_KEY);

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
    const ctx = useContext(SessionContext);

    if (!ctx) {
        throw new Error('useSession must be used within SessionProvider');
    }

    return ctx;
}
