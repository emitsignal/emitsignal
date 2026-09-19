import { useQueryClient } from '@tanstack/react-query';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useDevice } from '@/ctx/device';
import { api } from '@/lib/api';
import { getAppIdentity } from '@/lib/app-identity';
import { queryKeys } from '@/lib/query-client';

let hasPrompted = false;

// Only asks while the OS reports "undetermined", so an earlier allow/deny is never re-prompted.
export function usePushPermissionPrompt(enabled: boolean): void {
    const { deviceId, isLoading, pushToken, refreshPushToken } = useDevice();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled || isLoading || pushToken || !deviceId || hasPrompted || !Device.isDevice) {
            return;
        }

        hasPrompted = true;

        const prompt = async () => {
            const { canAskAgain, status } = await Notifications.getPermissionsAsync();

            if (status !== 'undetermined' || !canAskAgain) {
                return;
            }

            const token = await refreshPushToken();

            if (!token) {
                return;
            }

            await api.registerPushToken({ ...getAppIdentity(), deviceId, token });
            void queryClient.invalidateQueries({ queryKey: queryKeys.pushTokens });
        };

        prompt().catch((error) => console.warn('push permission prompt failed', error));
    }, [enabled, isLoading, pushToken, deviceId, refreshPushToken, queryClient]);
}
