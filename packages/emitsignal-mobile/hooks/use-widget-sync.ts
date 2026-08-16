import ExpoConstants from 'expo-constants';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { queryClient } from '@/lib/query-client';
import {
    subscribeWidgetSyncRequests,
    syncWidgetSnapshot,
    type WidgetSyncMode,
} from '@/lib/widget-snapshot';
import { subscribeReadIds } from '@/storage/read-messages';

const SYNC_DEBOUNCE_MS = 500;

const SYNCED_QUERY_DOMAINS = new Set(['feed', 'subscription-metrics', 'subscriptions']);

// Keeps the iOS home-screen widgets in sync with the app: whenever the feed,
// subscriptions, or metrics caches change (initial load, pull-to-refresh, SSE
// inserts), a message is marked read, the session changes, a sync is requested
// (foreground push received), or the app foregrounds/backgrounds, the widget
// snapshot is rebuilt and the timelines reloaded. The foreground sync also
// reconciles the approximate patches the notification service extension
// applies while the app is not running.
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

        const runSync = (mode: WidgetSyncMode = 'full') => {
            syncWidgetSnapshot({ ...syncOptions.current, mode }).catch(() => {});
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

        const unsubscribeSyncRequests = subscribeWidgetSyncRequests(scheduleSync);

        const appStateSubscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                scheduleSync();

                return;
            }

            if (state === 'background') {
                if (debounceTimer.current) {
                    clearTimeout(debounceTimer.current);
                }

                // Cached-only: a network fetch here could be cut short by iOS
                // suspending the app before the snapshot is written.
                runSync('cached-only');
            }
        });

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            unsubscribeQueryCache();
            unsubscribeReadIds();
            unsubscribeSyncRequests();
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
