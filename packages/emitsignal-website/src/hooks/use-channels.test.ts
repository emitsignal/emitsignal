import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import type { Subscription, Topic } from '#/lib/api';

import { useChannels } from '#/hooks/use-channels';

const subscriptionsMock = vi.hoisted(() => ({
    value: { loading: false, subscriptions: [] as Subscription[] },
}));
const topicsMock = vi.hoisted(() => ({ value: { loading: false, topics: [] as Topic[] } }));

vi.mock('#/ctx/subscriptions', () => ({ useSubscriptions: () => subscriptionsMock.value }));
vi.mock('#/hooks/use-topics', () => ({ useTopics: () => topicsMock.value }));

function subscription(name: string): Subscription {
    return {
        createdAt: 0,
        id: `sub-${name}`,
        pushEnabled: true,
        settings: { listenSince: 'subscription_date' },
        topic: topic(name),
    };
}

function topic(name: string): Topic {
    return {
        accessMode: 'public',
        createdAt: 0,
        displayName: name,
        id: `topic-${name}`,
        isOwner: true,
        name,
        ownerId: 'user-1',
    };
}

describe('useChannels', () => {
    test('lists owned topics you are not subscribed to', () => {
        subscriptionsMock.value = { loading: false, subscriptions: [subscription('alerts')] };
        topicsMock.value = { loading: false, topics: [topic('alerts'), topic('status-page')] };

        const { result } = renderHook(() => useChannels());

        expect(result.current.subscriptions.map((item) => item.topic.name)).toEqual(['alerts']);
        expect(result.current.owned.map((item) => item.name)).toEqual(['status-page']);
    });

    test('reports loading while either source is pending', () => {
        subscriptionsMock.value = { loading: false, subscriptions: [] };
        topicsMock.value = { loading: true, topics: [] };

        const { result } = renderHook(() => useChannels());

        expect(result.current.loading).toBe(true);
    });
});
