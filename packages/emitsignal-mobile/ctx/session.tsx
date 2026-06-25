import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect } from 'react';
import { Platform } from 'react-native';

import { api, setAuthToken } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { queryClient, queryKeys } from '@/lib/query-client';

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

            queryClient.invalidateQueries({ queryKey: queryKeys.feed(data.user.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions(data.user.id) });
        } else if (!isPending) {
            setAuthToken(null);
        }
    }, [data?.session?.token, isPending]);

    useEffect(() => {
        if (!data?.user?.id) {
            return;
        }

        const userId = data.user.id;

        const linkDevice = async () => {
            const [token, deviceId] = await Promise.all([
                AsyncStorage.getItem(PUSH_TOKEN_KEY),
                AsyncStorage.getItem(DEVICE_ID_KEY),
            ]);

            if (!deviceId) {
                return;
            }

            // Adopt this device's anonymous subscriptions into the account, then
            // refresh the cached views so the claimed channels render under the
            // signed-in scope.
            await api.claimSubscriptions(deviceId).catch(() => {});

            queryClient.invalidateQueries({ queryKey: queryKeys.feed(userId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions(userId) });

            if (!token) {
                return;
            }

            const platform =
                Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

            api.registerPushToken({ deviceId, platform, token, userId }).catch(() => {});
        };
        linkDevice();
    }, [data?.user?.id]);

    const value: SessionContextValue = {
        loading: isPending,
        signOut: async () => {
            await authClient.signOut();
            setAuthToken(null);

            // The active identity is gone, so every cached query (user-scoped feed
            // and subscriptions, plus unscoped billing and push-token records) is
            // now stale. Drop the whole cache so the anonymous device starts fresh.
            queryClient.clear();
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
