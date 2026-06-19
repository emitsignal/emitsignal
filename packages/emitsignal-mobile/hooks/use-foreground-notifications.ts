import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Linking, Platform } from 'react-native';

import { useDevice } from '@/ctx/device';
import { api } from '@/lib/api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function useForegroundNotifications() {
    const { deviceId } = useDevice();
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    const lastResponse =
        Platform.OS !== 'web' ? Notifications.useLastNotificationResponse() : undefined;
    const coldStartMessageId = useRef(
        lastResponse?.notification.request.content.data?.messageId as string | undefined,
    );
    const coldStartActionId = useRef(lastResponse?.actionIdentifier as string | undefined);

    useEffect(() => {
        registerCategories();

        if (coldStartMessageId.current) {
            const data = lastResponse?.notification.request.content.data ?? {};

            handleAction(coldStartActionId.current, coldStartMessageId.current, data);
        }

        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log('Notification received in foreground:', notification);
            },
        );

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data;
                console.log('Notification tapped:', data);

                const messageId = data?.messageId as string | undefined;

                if (!messageId) {
                    return;
                }

                handleAction(response.actionIdentifier, messageId, data);
            },
        );

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [deviceId]);

    function handleAction(
        actionIdentifier: string | undefined,
        messageId: string,
        data: Record<string, unknown> | undefined,
    ) {
        if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER || !actionIdentifier) {
            router.push(`/messages/${encodeURIComponent(messageId)}`);

            return;
        }

        if (actionIdentifier === 'acknowledge') {
            if (deviceId) {
                api.acknowledgeMessage(messageId, deviceId).catch((error) =>
                    console.warn('Acknowledge failed:', error),
                );
            }

            return;
        }

        if (actionIdentifier === 'view') {
            const actionsRaw = data?.actions as string | undefined;

            if (actionsRaw) {
                try {
                    const actions = JSON.parse(actionsRaw) as Array<{
                        type: string;
                        url?: string;
                    }>;
                    const viewAction = actions.find((a) => a.type === 'view');

                    if (viewAction?.url) {
                        Linking.openURL(viewAction.url).catch((error) =>
                            console.warn('Failed to open URL:', error),
                        );
                    }
                } catch {
                    // ignore parse error
                }
            }
            return;
        }

        router.push(`/messages/${encodeURIComponent(messageId)}`);
    }
}

function registerCategories() {
    if (Platform.OS === 'web') {
        return;
    }

    Notifications.setNotificationCategoryAsync('emitsignal-message', [
        {
            buttonTitle: 'Acknowledge',
            identifier: 'acknowledge',
            options: { opensAppToForeground: true },
        },
        {
            buttonTitle: 'View',
            identifier: 'view',
            options: { opensAppToForeground: true },
        },
    ]).catch((error) => console.warn('Failed to register notification category:', error));
}
