import ExpoConstants from 'expo-constants';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { queryClient } from '@/lib/query-client';
import { syncWidgetSnapshot } from '@/lib/widget-snapshot';
import { subscribeReadIds } from '@/storage/read-messages';

const SYNC_DEBOUNCE_MS = 500;

const SYNCED_QUERY_DOMAINS = new Set(['feed', 'subscription-metrics', 'subscriptions']);

// Keeps the iOS home-screen widgets in sync with the app: whenever the feed,
// subscriptions, or metrics caches change (initial load, pull-to-refresh, SSE
// inserts), a message is marked read, the session changes, or the app
// backgrounds, the widget snapshot is rebuilt and the timelines reloaded.
export function useWidgetSync(): void {
    const { deviceId } = useDevice();
    const { loading: sessionLoading, user } = useSession();

    const userId = user?.id ?? null;
    const scope = userId ?? deviceId ?? '';

    const debounceTimer = useRef<null | ReturnType<typeof setTimeout>>(null);
    const syncOptions = useRef({ deviceId, scheme: resolveScheme(), scope, userId });

    syncOptions.current = { deviceId, scheme: resolveScheme(), scope, userId };

    useEffect(() => {
        if (Platform.OS !== 'ios') {
            return;
        }

        const runSync = () => {
            syncWidgetSnapshot(syncOptions.current).catch(() => {});
        };

        const scheduleSync = () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            debounceTimer.current = setTimeout(runSync, SYNC_DEBOUNCE_MS);
        };

        const unsubscribeQueryCache = queryClient.getQueryCache().subscribe((event) => {
            const [domain, keyScope] = event.query.queryKey;

            if (
                typeof domain === 'string' &&
                SYNCED_QUERY_DOMAINS.has(domain) &&
                keyScope === syncOptions.current.scope &&
                event.type === 'updated'
            ) {
                scheduleSync();
            }
        });

        const unsubscribeReadIds = subscribeReadIds(scheduleSync);

        const appStateSubscription = AppState.addEventListener('change', (state) => {
            if (state === 'background') {
                if (debounceTimer.current) {
                    clearTimeout(debounceTimer.current);
                }

                runSync();
            }
        });

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            unsubscribeQueryCache();
            unsubscribeReadIds();
            appStateSubscription.remove();
        };
    }, []);

    // Resync when the active identity settles or changes (sign-in, device ready).
    useEffect(() => {
        if (Platform.OS !== 'ios' || sessionLoading || !scope) {
            return;
        }

        syncWidgetSnapshot(syncOptions.current).catch(() => {});
    }, [scope, sessionLoading]);
}

function resolveScheme(): string {
    const scheme = ExpoConstants.expoConfig?.scheme;

    if (Array.isArray(scheme)) {
        return scheme[0] ?? 'emitsignal';
    }

    return scheme ?? 'emitsignal';
}
