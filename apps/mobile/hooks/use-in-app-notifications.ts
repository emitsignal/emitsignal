import { useEffect, useRef, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

interface Message {
    _id: string;
    title: string;
    body: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    createdAt: number;
}

interface UseInAppNotificationsProps {
    topicId?: string;
    topicName: string;
}

export function useInAppNotifications({
    topicId,
    topicName,
}: UseInAppNotificationsProps) {
    const previousMessagesRef = useRef<Message[]>([]);
    const isFirstLoadRef = useRef(true);

    const scheduleNotification = useCallback(
        async (message: Message) => {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: message.title,
                    body: message.body,
                    data: {
                        topicId,
                        topicName,
                        messageId: message._id,
                        priority: message.priority,
                    },
                },
                trigger: null, // Show immediately
            });
        },
        [topicId, topicName]
    );

    const detectAndNotify = useCallback(
        (messages: Message[] | undefined) => {
            if (!messages) {
                isFirstLoadRef.current = true;
                return;
            }

            // Skip detection on first load
            if (isFirstLoadRef.current) {
                previousMessagesRef.current = messages;
                isFirstLoadRef.current = false;
                return;
            }

            // Detect new messages by comparing with previous
            const previousIds = new Set(
                previousMessagesRef.current.map((m) => m._id)
            );
            const newMessages = messages.filter((m) => !previousIds.has(m._id));

            if (newMessages.length > 0) {
                // Get the most recent new message
                const mostRecent = newMessages.sort(
                    (a, b) => b.createdAt - a.createdAt
                )[0];

                // Schedule native notification
                scheduleNotification(mostRecent);
            }

            previousMessagesRef.current = messages;
        },
        [scheduleNotification]
    );

    return { detectAndNotify };
}
