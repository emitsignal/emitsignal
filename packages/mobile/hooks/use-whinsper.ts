// Data layer for the Whinsper UI. Wraps the REST client + SSE for live updates.

import { useCallback, useEffect, useState } from "react";

import { useDevice } from "@/ctx/device";
import { api, sseMultiUrl, type Message, type Subscription } from "@/lib/api";

import { useSSE } from "./use-sse";

interface FeedState {
    messages: Message[];
    subscriptions: Subscription[];
    loading: boolean;
    error: Error | null;
}

export function useFeed() {
    const { deviceId } = useDevice();
    const [state, setState] = useState<FeedState>({
        messages: [],
        subscriptions: [],
        loading: true,
        error: null,
    });

    const refresh = useCallback(async () => {
        if (!deviceId) return;
        try {
            const subs = await api.listSubscriptions(deviceId);
            const allMessages: Message[] = [];
            for (const sub of subs) {
                const msgs = await api.listMessages(sub.topic.name, 25);
                allMessages.push(...msgs);
            }
            allMessages.sort((a, b) => b.createdAt - a.createdAt);
            setState({
                messages: allMessages,
                subscriptions: subs,
                loading: false,
                error: null,
            });
        } catch (error) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error : new Error(String(error)),
            }));
        }
    }, [deviceId]);

    useEffect(() => {
        if (deviceId) refresh();
    }, [deviceId, refresh]);

    const topicNames = state.subscriptions.map((s) => s.topic.name);
    const sseTarget = topicNames.length ? sseMultiUrl(topicNames) : null;

    useSSE({
        url: sseTarget,
        onEvent: (event, data) => {
            if (event !== "message") return;
            const incoming = data as Message & { topicName?: string };
            setState((prev) => {
                if (prev.messages.some((m) => m.id === incoming.id)) {
                    return prev;
                }
                return {
                    ...prev,
                    messages: [incoming, ...prev.messages].slice(0, 200),
                };
            });
        },
    });

    return { ...state, refresh };
}

export function useTopicMessages(topicName: string | null) {
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
        url: topicName
            ? `${api.baseUrl}/topics/${encodeURIComponent(topicName)}/listen`
            : null,
        onEvent: (event, data) => {
            if (event !== "message") return;
            const incoming = data as Message;
            setMessages((prev) => {
                if (prev.some((m) => m.id === incoming.id)) return prev;
                return [incoming, ...prev];
            });
        },
    });

    return { messages, loading };
}
