import { useCallback, useEffect, useState } from 'react';

import { useDevice } from '@/ctx/device';
import { useSession } from '@/ctx/session';
import { api, type Message, sseMultiUrl, type Subscription } from '@/lib/api';

import { useSSE } from './use-sse';

interface FeedState {
    error: Error | null;
    loading: boolean;
    messages: Message[];
    subscriptions: Subscription[];
}

export function useFeed() {
    const { deviceId } = useDevice();
    const { loading: sessionLoading, user } = useSession();

    const [state, setState] = useState<FeedState>({
        error: null,
        loading: true,
        messages: [],
        subscriptions: [],
    });

    const userId = user?.id;

    const refresh = useCallback(async () => {
        if (sessionLoading) {
            return;
        }

        if (!userId && !deviceId) {
            return;
        }

        try {
            const subscriptions = await api.listSubscriptions(
                userId ? undefined : (deviceId ?? undefined),
            );

            const allMessages: Message[] = [];

            for (const subscription of subscriptions) {
                const messages = await api.listMessages(subscription.topic.name, 25);

                allMessages.push(...messages);
            }

            allMessages.sort((a, b) => b.createdAt - a.createdAt);

            setState({
                error: null,
                loading: false,
                messages: allMessages,
                subscriptions: subscriptions,
            });
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error: error instanceof Error ? error : new Error(String(error)),
                loading: false,
            }));
        }
    }, [sessionLoading, userId, deviceId]);

    useEffect(() => {
        if (!sessionLoading && (userId || deviceId)) {
            refresh();
        }
    }, [sessionLoading, userId, deviceId, refresh]);

    const topicNames = state.subscriptions.map((subscription) => subscription.topic.name);
    const sseTarget = topicNames.length ? sseMultiUrl(topicNames) : null;

    useSSE({
        onEvent: (event, data) => {
            if (event !== 'message') {
                return;
            }

            const incoming = data as { topicName?: string } & Message;

            setState((prev) => {
                if (prev.messages.some((message) => message.id === incoming.id)) {
                    return prev;
                }

                return {
                    ...prev,
                    messages: [incoming, ...prev.messages].slice(0, 200),
                };
            });
        },
        url: sseTarget,
    });

    return { ...state, refresh };
}

export function useTopicMessages(topicName: null | string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!topicName) {
            return;
        }

        let cancelled = false;

        setLoading(true);
        api.listMessages(topicName)
            .then((messages) => {
                if (!cancelled) {
                    setMessages(messages);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [topicName]);

    useSSE({
        onEvent: (event, data) => {
            if (event !== 'message') {
                return;
            }
            const incoming = data as Message;
            setMessages((prev) => {
                if (prev.some((message) => message.id === incoming.id)) return prev;
                return [incoming, ...prev];
            });
        },
        url: topicName ? `${api.baseUrl}/topics/${encodeURIComponent(topicName)}/listen` : null,
    });

    return { loading, messages };
}
