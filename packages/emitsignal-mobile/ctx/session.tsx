import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect } from 'react';
import { Platform } from 'react-native';

import { api, setAuthToken } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

const DEVICE_ID_KEY = '@emitsignal/device_id';
const PUSH_TOKEN_KEY = '@emitsignal/push_token';

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
    onboarded: boolean;
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

    useEffect(() => {
        if (!data?.user?.id) {
            return;
        }

        const linkToken = async () => {
            const [token, deviceId] = await Promise.all([
                AsyncStorage.getItem(PUSH_TOKEN_KEY),
                AsyncStorage.getItem(DEVICE_ID_KEY),
            ]);

            if (!token || !deviceId) {
                return;
            }

            const platform =
                Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

            api.registerPushToken({ deviceId, platform, token, userId: data.user.id }).catch(
                () => {},
            );
        };
        linkToken();
    }, [data?.user?.id]);

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
                  onboarded: data.user.onboarded ?? false,
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
