import { useCallback, useEffect, useState } from 'react';

import type { Message, Subscription } from '#/lib/api';

import { api, sseMultiUrl, sseUrl } from '#/lib/api';
import { getDeviceId } from '#/lib/storage';

import { useSSE } from './use-sse';

interface FeedState {
    error: Error | null;
    loading: boolean;
    messages: Message[];
    subscriptions: Subscription[];
}

export function useFeed() {
    const [state, setState] = useState<FeedState>({
        error: null,
        loading: true,
        messages: [],
        subscriptions: [],
    });

    const deviceId = getDeviceId();

    const refresh = useCallback(async () => {
        try {
            const subscriptions = await api.listSubscriptions(deviceId);
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
                subscriptions,
            });
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error: error instanceof Error ? error : new Error(String(error)),
                loading: false,
            }));
        }
    }, [deviceId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const topicNames = state.subscriptions.map((s) => s.topic.name);
    const sseTarget = topicNames.length ? sseMultiUrl(topicNames) : null;

    useSSE({
        onEvent: (event, data) => {
            if (event !== 'message') return;
            const incoming = data as { topicName?: string } & Message;

            setState((prev) => {
                if (prev.messages.some((m) => m.id === incoming.id)) return prev;
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
        if (!topicName) return;

        let cancelled = false;

        setLoading(true);
        api.listMessages(topicName)
            .then((msgs) => {
                if (!cancelled) {
                    setMessages(msgs);
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
            if (event !== 'message') return;
            const incoming = data as Message;
            setMessages((prev) => {
                if (prev.some((m) => m.id === incoming.id)) return prev;
                return [incoming, ...prev];
            });
        },
        url: topicName ? sseUrl(topicName) : null,
    });

    return { loading, messages };
}
