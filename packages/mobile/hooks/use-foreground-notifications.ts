import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

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

    useEffect(() => {
        // Listen for incoming notifications while app is in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log("Notification received in foreground:", notification);
            },
        );

        // Listen for notification responses (when user taps notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data;
                console.log("Notification tapped:", data);

                // Navigate to the topic if topicName is provided
                if (data?.topicName) {
                    router.push(`/topics/${data.topicName}`);
                }
            },
        );

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, []);
}
