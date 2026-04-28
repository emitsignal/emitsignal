import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { api } from "@/lib/api";

const SESSION_KEY = "@whinsper_session";

interface SessionUser {
    id: string;
    email: string;
    name: string | null;
}

interface SessionContextValue {
    token: string | null;
    user: SessionUser | null;
    loading: boolean;
    signIn: (token: string, user: SessionUser) => Promise<void>;
    signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);

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
                    // Verify still valid
                    await api.me(parsed.token);
                    if (cancelled) return;
                    setToken(parsed.token);
                    setUser(parsed.user);
                } catch {
                    await AsyncStorage.removeItem(SESSION_KEY);
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })
            .catch(() => setLoading(false));
        return () => {
            cancelled = true;
        };
    }, []);

    const signIn = async (newToken: string, newUser: SessionUser) => {
        await AsyncStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ token: newToken, user: newUser }),
        );
        setToken(newToken);
        setUser(newUser);
    };

    const signOut = async () => {
        await AsyncStorage.removeItem(SESSION_KEY);
        setToken(null);
        setUser(null);
    };

    return (
        <SessionContext.Provider value={{ token, user, loading, signIn, signOut }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("useSession must be used within SessionProvider");
    return ctx;
}
