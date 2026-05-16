import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

// Configure notification handler for foreground notifications
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
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    const lastResponse = Notifications.useLastNotificationResponse();
    const coldStartMessageId = useRef(
        lastResponse?.notification.request.content.data?.messageId as string | undefined,
    );

    useEffect(() => {
        // Handle cold-start notification response after navigator is mounted
        if (coldStartMessageId.current) {
            router.push(`/messages/${encodeURIComponent(coldStartMessageId.current)}`);
        }

        // Listen for incoming notifications while app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log('Notification received in foreground:', notification);
            },
        );

        // Listen for notification responses (when user taps notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data;
                console.log('Notification tapped:', data);

                if (data?.messageId) {
                    router.push(`/messages/${encodeURIComponent(data.messageId as string)}`);
                }
            },
        );

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);
}
