/// <reference types="bun" />

import type { Message, Subscription } from '@emitsignal/shared/api';

import { describe, expect, it } from 'bun:test';

import { buildWidgetSnapshot } from './widget-snapshot-builder';

const NOW = 1_800_000_000_000;

function makeMessage(overrides: { id: string } & Partial<Message>): Message {
    return {
        acknowledgmentCount: 0,
        actions: [],
        attachments: [],
        bannerImage: null,
        body: 'body',
        createdAt: NOW - 60_000,
        inlineAttachments: [],
        inlineImages: [],
        priority: 3,
        tags: [],
        title: 'title',
        topicId: 'topic-1',
        topicName: 'alerts',
        ...overrides,
    };
}

function makeSubscription(overrides: { topicId: string; topicName: string }): Subscription {
    return {
        createdAt: NOW - 1000,
        id: `subscription-${overrides.topicId}`,
        pushEnabled: true,
        settings: { listenSince: 'subscription_date' },
        topic: {
            accessMode: 'public',
            createdAt: NOW - 1000,
            displayName: overrides.topicName,
            id: overrides.topicId,
            name: overrides.topicName,
        },
    };
}

describe('buildWidgetSnapshot', () => {
    it('returns an empty snapshot without data', () => {
        const snapshot = buildWidgetSnapshot({
            messages: [],
            metrics: {},
            now: NOW,
            readIds: new Set(),
            scheme: 'emitsignal',
            subscriptions: [],
        });

        expect(snapshot.hasData).toBe(false);
        expect(snapshot.live).toBe(false);
        expect(snapshot.unreadCount).toBe(0);
        expect(snapshot.primaryTopic).toBeNull();
        expect(snapshot.volume.trendPct).toBeNull();
        expect(snapshot.schemaVersion).toBe(1);
        expect(snapshot.updatedAt).toBe(NOW);
    });

    it('computes unread counts against the read-id set', () => {
        const snapshot = buildWidgetSnapshot({
            messages: [
                makeMessage({ id: 'm1' }),
                makeMessage({ id: 'm2' }),
                makeMessage({ id: 'm3' }),
            ],
            metrics: {},
            now: NOW,
            readIds: new Set(['m2']),
            scheme: 'emitsignal',
            subscriptions: [makeSubscription({ topicId: 'topic-1', topicName: 'alerts' })],
        });

        expect(snapshot.unreadCount).toBe(2);
        expect(snapshot.recent.map((message) => message.unread)).toEqual([true, false, true]);
        expect(snapshot.channels[0].unread).toBe(2);
    });

    it('caps recent messages at six and resolves topic names from subscriptions', () => {
        const messages = Array.from({ length: 8 }, (_, index) =>
            makeMessage({ id: `m${index}`, topicName: undefined }),
        );

        const snapshot = buildWidgetSnapshot({
            messages,
            metrics: {},
            now: NOW,
            readIds: new Set(),
            scheme: 'emitsignal',
            subscriptions: [makeSubscription({ topicId: 'topic-1', topicName: 'alerts' })],
        });

        expect(snapshot.recent).toHaveLength(6);
        expect(snapshot.recent[0].topicName).toBe('alerts');
        expect(snapshot.primaryTopic).toBe('alerts');
    });

    it('pair-sums 24 hourly volume buckets into 12 and totals counts', () => {
        const volume = Array.from({ length: 24 }, () => 1);

        const snapshot = buildWidgetSnapshot({
            messages: [],
            metrics: {
                'topic-1': { messageCount24h: 14, volume },
                'topic-2': { messageCount24h: 10, volume },
            },
            now: NOW,
            readIds: new Set(),
            scheme: 'emitsignal',
            subscriptions: [
                makeSubscription({ topicId: 'topic-1', topicName: 'alerts' }),
                makeSubscription({ topicId: 'topic-2', topicName: 'deploys' }),
            ],
        });

        expect(snapshot.volume.buckets12).toHaveLength(12);
        expect(snapshot.volume.buckets12.every((bucket) => bucket === 4)).toBe(true);
        expect(snapshot.volume.total24h).toBe(24);
    });

    it('computes the trend from older vs newer half and hides it without a baseline', () => {
        const risingVolume = [
            ...Array.from({ length: 12 }, () => 1),
            ...Array.from({ length: 12 }, () => 2),
        ];

        const rising = buildWidgetSnapshot({
            messages: [],
            metrics: { 'topic-1': { messageCount24h: 36, volume: risingVolume } },
            now: NOW,
            readIds: new Set(),
            scheme: 'emitsignal',
            subscriptions: [makeSubscription({ topicId: 'topic-1', topicName: 'alerts' })],
        });

        expect(rising.volume.trendPct).toBe(100);

        const noBaseline = buildWidgetSnapshot({
            messages: [],
            metrics: {
                'topic-1': {
                    messageCount24h: 5,
                    volume: [
                        ...Array.from({ length: 12 }, () => 0),
                        ...Array.from({ length: 12 }, () => 1),
                    ],
                },
            },
            now: NOW,
            readIds: new Set(),
            scheme: 'emitsignal',
            subscriptions: [makeSubscription({ topicId: 'topic-1', topicName: 'alerts' })],
        });

        expect(noBaseline.volume.trendPct).toBeNull();
    });

    it('sorts channels by unread then activity and counts today correctly', () => {
        const snapshot = buildWidgetSnapshot({
            messages: [
                makeMessage({ id: 'm1', priority: 5, topicId: 'topic-1', topicName: 'alerts' }),
                makeMessage({ id: 'm2', priority: 2, topicId: 'topic-2', topicName: 'deploys' }),
                makeMessage({
                    createdAt: NOW - 2 * 24 * 60 * 60 * 1000,
                    id: 'm-old',
                    topicId: 'topic-2',
                    topicName: 'deploys',
                }),
            ],
            metrics: {
                'topic-1': { messageCount24h: 1, volume: [] },
                'topic-2': { messageCount24h: 9, volume: [] },
            },
            now: NOW,
            readIds: new Set(['m1']),
            scheme: 'emitsignal',
            subscriptions: [
                makeSubscription({ topicId: 'topic-1', topicName: 'alerts' }),
                makeSubscription({ topicId: 'topic-2', topicName: 'deploys' }),
            ],
        });

        expect(snapshot.channels.map((channel) => channel.name)).toEqual(['deploys', 'alerts']);
        expect(snapshot.channels[0].topPriority).toBe(3);
        expect(snapshot.channels[1].topPriority).toBe(5);
        expect(snapshot.todayMoreCount).toBe(1);
    });
});
