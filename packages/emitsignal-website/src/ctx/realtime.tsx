import {
    createContext,
    type ReactElement,
    type ReactNode,
    type RefObject,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import type { RealtimeMessage, RealtimeStatus } from '#/lib/realtime';

import { useSession } from '#/ctx/session';
import { useSubscriptions } from '#/ctx/subscriptions';
import { useSSE } from '#/hooks/use-sse';
import { sseMultiUrl } from '#/lib/api';
import {
    isRealtimeMessage,
    REALTIME_MAX_REPLAY_WINDOW_MS,
    REALTIME_SETTLE_DELAY_MS,
    topicUnionKey,
} from '#/lib/realtime';

interface RealtimeContextValue {
    connectedTopicNames: readonly string[];
    status: RealtimeStatus;
    subscribe: (subscriber: RealtimeSubscriber) => () => void;
}

interface RealtimeSubscriber {
    handlerRef: RefObject<(message: RealtimeMessage) => void>;
    registeredAt: number;
    topicNames: readonly string[];
}

interface UseRealtimeTopicsOptions {
    enabled?: boolean;
    onMessage: (message: RealtimeMessage) => void;
    topicNames: readonly string[];
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }): ReactElement {
    const [connection, setConnection] = useState<{ topicKey: string; url: null | string }>({
        topicKey: '',
        url: null,
    });
    const [status, setStatus] = useState<RealtimeStatus>('closed');

    const { loading: authLoading } = useSession();
    const { loading: subscriptionsLoading, subscriptions } = useSubscriptions();

    const subscriptionTopicKey = topicUnionKey(
        subscriptions.map((subscription) => subscription.topic.name),
    );

    const committedTopicKeyRef = useRef<null | string>(null);
    const lastEventAtRef = useRef(0);
    const readyRef = useRef(false);
    const settleTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null);
    const subscriberIdRef = useRef(0);
    const subscribersRef = useRef(new Map<number, RealtimeSubscriber>());
    const subscriptionTopicKeyRef = useRef(subscriptionTopicKey);

    subscriptionTopicKeyRef.current = subscriptionTopicKey;

    const commitTopicUnion = useCallback(() => {
        if (!readyRef.current) {
            return;
        }

        const union = new Set<string>();

        for (const topicName of subscriptionTopicKeyRef.current.split(',')) {
            if (topicName) {
                union.add(topicName);
            }
        }

        for (const subscriber of subscribersRef.current.values()) {
            subscriber.topicNames.forEach((topicName) => union.add(topicName));
        }

        const topicKey = topicUnionKey(union);

        // The whole point of the settle window: an unmount/remount pair across a
        // route transition produces the same key, so the stream is left alone.
        if (topicKey === committedTopicKeyRef.current) {
            return;
        }

        const isReconnect = committedTopicKeyRef.current !== null;

        committedTopicKeyRef.current = topicKey;

        const topicNames = topicKey ? topicKey.split(',') : [];
        // Replaying on the very first connect would duplicate rows the queries
        // already fetched; only a reconnect has a gap worth filling.
        const since = isReconnect
            ? Math.max(lastEventAtRef.current, Date.now() - REALTIME_MAX_REPLAY_WINDOW_MS)
            : undefined;

        setStatus('connecting');
        setConnection({ topicKey, url: sseMultiUrl(topicNames, since) });
    }, []);

    const scheduleTopicUnionCommit = useCallback(() => {
        if (settleTimerRef.current) {
            clearTimeout(settleTimerRef.current);
        }

        settleTimerRef.current = setTimeout(() => {
            settleTimerRef.current = null;
            commitTopicUnion();
        }, REALTIME_SETTLE_DELAY_MS);
    }, [commitTopicUnion]);

    const subscribe = useCallback(
        (subscriber: RealtimeSubscriber) => {
            const id = subscriberIdRef.current++;

            subscribersRef.current.set(id, subscriber);
            scheduleTopicUnionCommit();

            return () => {
                subscribersRef.current.delete(id);
                scheduleTopicUnionCommit();
            };
        },
        [scheduleTopicUnionCommit],
    );

    const ready = !authLoading && !subscriptionsLoading;

    readyRef.current = ready;

    useEffect(() => {
        if (!ready) {
            return;
        }

        scheduleTopicUnionCommit();
    }, [ready, scheduleTopicUnionCommit, subscriptionTopicKey]);

    useEffect(() => {
        return () => {
            if (settleTimerRef.current) {
                clearTimeout(settleTimerRef.current);
            }
        };
    }, []);

    useSSE({
        onError: () => setStatus('error'),
        onEvent: (event, data) => {
            if (event !== 'message' || !isRealtimeMessage(data)) {
                return;
            }

            lastEventAtRef.current = Math.max(lastEventAtRef.current, data.createdAt);

            for (const subscriber of subscribersRef.current.values()) {
                if (!subscriber.topicNames.includes(data.topicName)) {
                    continue;
                }

                // A widened union replays the new topic's backlog. A subscriber
                // that mounted after those messages already has them from its own
                // query, so only forward what it could actually have missed.
                if (data.createdAt < subscriber.registeredAt) {
                    continue;
                }

                subscriber.handlerRef.current(data);
            }
        },
        onOpen: () => setStatus('open'),
        url: connection.url,
    });

    const value = useMemo<RealtimeContextValue>(
        () => ({
            connectedTopicNames: connection.topicKey ? connection.topicKey.split(',') : [],
            status,
            subscribe,
        }),
        [connection.topicKey, status, subscribe],
    );

    return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
    const context = useContext(RealtimeContext);

    if (!context) {
        throw new Error('useRealtime must be used within a RealtimeProvider');
    }

    return context;
}

export function useRealtimeTopics({
    enabled = true,
    onMessage,
    topicNames,
}: UseRealtimeTopicsOptions): void {
    const { subscribe } = useRealtime();

    const handlerRef = useRef(onMessage);

    handlerRef.current = onMessage;

    const topicKey = topicUnionKey(topicNames);

    useEffect(() => {
        if (!enabled || !topicKey) {
            return;
        }

        return subscribe({
            handlerRef,
            registeredAt: Date.now(),
            topicNames: topicKey.split(','),
        });
    }, [enabled, subscribe, topicKey]);
}
