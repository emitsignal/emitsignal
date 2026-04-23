import { useEffect, useRef, useState, useCallback } from "react";

interface Message {
    _id: string;
    title: string;
    body: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    createdAt: number;
}

interface NewMessage {
    message: Message;
    isNew: boolean;
}

export function useNewMessageDetector(messages: Message[] | undefined) {
    const [newMessage, setNewMessage] = useState<NewMessage | null>(null);
    const previousMessagesRef = useRef<Message[]>([]);
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
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
        const previousIds = new Set(previousMessagesRef.current.map((m) => m._id));
        const newMessages = messages.filter((m) => !previousIds.has(m._id));

        if (newMessages.length > 0) {
            // Get the most recent new message
            const mostRecent = newMessages.sort(
                (a, b) => b.createdAt - a.createdAt
            )[0];

            setNewMessage({
                message: mostRecent,
                isNew: true,
            });
        }

        previousMessagesRef.current = messages;
    }, [messages]);

    const dismissNewMessage = useCallback(() => {
        setNewMessage(null);
    }, []);

    return {
        newMessage,
        dismissNewMessage,
    };
}
