import type { Message, Subscription, SubscriptionMetricsMap } from '@emitsignal/shared/api';

// Mirrors WidgetSnapshot in targets/widgets/Snapshot.swift. Bump schemaVersion
// on breaking changes; the widget falls back to its placeholder when the
// versions disagree. Kept free of react-native imports so it can run under
// `bun test`.

export interface BuildWidgetSnapshotInput {
    messages: Message[];
    metrics: SubscriptionMetricsMap;
    now?: number;
    readIds: Set<string>;
    scheme: string;
    subscriptions: Subscription[];
}

export interface WidgetSnapshot {
    channelCount: number;
    channels: WidgetSnapshotChannel[];
    hasData: boolean;
    live: boolean;
    primaryTopic: null | string;
    recent: WidgetSnapshotMessage[];
    schemaVersion: 1;
    scheme: string;
    todayMoreCount: number;
    unreadCount: number;
    updatedAt: number;
    volume: WidgetSnapshotVolume;
}

export interface WidgetSnapshotChannel {
    count24h: number;
    id: string;
    name: string;
    topPriority: number;
    unread: number;
}

export interface WidgetSnapshotMessage {
    createdAt: number;
    id: string;
    priority: number;
    title: string;
    topicName: string;
    unread: boolean;
}

export interface WidgetSnapshotVolume {
    buckets12: number[];
    total24h: number;
    trendPct: null | number;
}

const MAX_CHANNELS = 8;
const MAX_RECENT = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

export function buildWidgetSnapshot(input: BuildWidgetSnapshotInput): WidgetSnapshot {
    const { messages, metrics, readIds, scheme, subscriptions } = input;

    const now = input.now ?? Date.now();

    const topicNameById = new Map<string, string>();

    for (const subscription of subscriptions) {
        topicNameById.set(subscription.topic.id, subscription.topic.name);
    }

    const topicNameFor = (message: Message): string =>
        message.topicName ?? topicNameById.get(message.topicId) ?? 'unknown';

    const unreadMessages = messages.filter((message) => !readIds.has(message.id));

    const channels = subscriptions
        .map((subscription) => {
            const topicMessages = messages.filter(
                (message) => message.topicId === subscription.topic.id,
            );

            const topPriority = topicMessages.reduce(
                (highest, message) => Math.max(highest, message.priority),
                0,
            );

            return {
                count24h: metrics[subscription.topic.id]?.messageCount24h ?? 0,
                id: subscription.topic.id,
                name: subscription.topic.name,
                topPriority: topPriority || 1,
                unread: topicMessages.filter((message) => !readIds.has(message.id)).length,
            };
        })
        .sort((first, second) => second.unread - first.unread || second.count24h - first.count24h)
        .slice(0, MAX_CHANNELS);

    const recent = messages.slice(0, MAX_RECENT).map((message) => ({
        createdAt: message.createdAt,
        id: message.id,
        priority: message.priority,
        title: message.title || message.body,
        topicName: topicNameFor(message),
        unread: !readIds.has(message.id),
    }));

    const messagesToday = messages.filter((message) => now - message.createdAt < DAY_MS);

    const hourlyBuckets: number[] = Array.from({ length: 24 }, () => 0);
    let total24h = 0;

    for (const topicMetrics of Object.values(metrics)) {
        total24h += topicMetrics.messageCount24h;

        topicMetrics.volume.forEach((count, index) => {
            if (index < hourlyBuckets.length) {
                hourlyBuckets[index] += count;
            }
        });
    }

    const buckets12 = Array.from(
        { length: 12 },
        (_, index) => hourlyBuckets[index * 2] + hourlyBuckets[index * 2 + 1],
    );

    // The API exposes no previous-day baseline, so the trend compares the older
    // half of the 24h window against the newer half (buckets are newest-last).
    const olderHalf = hourlyBuckets.slice(0, 12).reduce((sum, count) => sum + count, 0);
    const newerHalf = hourlyBuckets.slice(12).reduce((sum, count) => sum + count, 0);
    const trendPct = olderHalf > 0 ? ((newerHalf - olderHalf) / olderHalf) * 100 : null;

    return {
        channelCount: subscriptions.length,
        channels,
        hasData: messages.length > 0 || subscriptions.length > 0,
        live: subscriptions.length > 0,
        primaryTopic: recent[0]?.topicName ?? null,
        recent,
        schemaVersion: 1,
        scheme,
        todayMoreCount: Math.max(messagesToday.length - 1, 0),
        unreadCount: unreadMessages.length,
        updatedAt: now,
        volume: { buckets12, total24h, trendPct },
    };
}
