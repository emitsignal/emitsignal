import { useCallback, useEffect, useRef, useState } from 'react';

import type { Message, Subscription, TopicMetrics } from '#/lib/api';

import { useSession } from '#/ctx/session';
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
    const deviceId = getDeviceId();
    const { loading: authLoading, user } = useSession();

    const [state, setState] = useState<FeedState>({
        error: null,
        loading: true,
        messages: [],
        subscriptions: [],
    });

    const userId = user?.id;

    const refresh = useCallback(async () => {
        try {
            const subscriptions = await api.listSubscriptions(userId ? undefined : deviceId);
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
    }, [userId, deviceId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

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
        url: !authLoading && sseTarget ? sseTarget : null,
    });

    return { ...state, refresh };
}

export function useTopicMessages(
    topicName: null | string,
    onNewMessage?: (message: Message) => void,
) {
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const seenIdsRef = useRef(new Set<string>());

    const { loading: authLoading } = useSession();

    useEffect(() => {
        if (!topicName) {
            return;
        }

        let cancelled = false;

        setLoading(true);
        api.listMessages(topicName)
            .then((fetchedMessages) => {
                if (!cancelled) {
                    seenIdsRef.current = new Set(fetchedMessages.map((message) => message.id));

                    setMessages(fetchedMessages);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [topicName]);

    const onNewMessageRef = useRef(onNewMessage);
    onNewMessageRef.current = onNewMessage;

    useSSE({
        onEvent: (event, data) => {
            if (event !== 'message') {
                return;
            }

            const incoming = data as Message;

            if (seenIdsRef.current.has(incoming.id)) {
                return;
            }

            seenIdsRef.current.add(incoming.id);
            setMessages((prev) => [incoming, ...prev]);
            onNewMessageRef.current?.(incoming);
        },
        url: !authLoading && topicName ? sseUrl(topicName) : null,
    });

    return { loading, messages };
}

export function useTopicMetrics(topicName: null | string) {
    const [metrics, setMetrics] = useState<null | TopicMetrics>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!topicName) {
            setMetrics(null);

            return setLoading(false);
        }

        let cancelled = false;

        setLoading(true);

        api.getTopicMetrics(topicName)
            .then((data) => {
                if (!cancelled) {
                    setMetrics(data);
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

    const addMessage = useCallback((msg: Message) => {
        setMetrics((prev) => {
            if (!prev) {
                return prev;
            }

            const volume = [...prev.volume];

            volume[23]++;

            return {
                ...prev,
                messageCount24h: prev.messageCount24h + 1,
                p5Count24h: prev.p5Count24h + (msg.priority === 5 ? 1 : 0),
                volume,
            };
        });
    }, []);

    return { addMessage, loading, metrics };
}
