import { useMemo } from 'react';

import type { Subscription, Topic } from '#/lib/api';

import { useSubscriptions } from '#/ctx/subscriptions';
import { useTopics } from '#/hooks/use-topics';

interface ChannelsResult {
    loading: boolean;
    owned: Topic[];
    subscriptions: Subscription[];
}

/**
 * The dashboard's channel list is the union of two independent queries:
 * `GET /subscriptions` and `GET /topics` (owner-scoped). A topic you own *and*
 * subscribe to is only ever reported as a subscription — the subscription row
 * already carries `topic.isOwner`, so listing it twice would be redundant.
 */
export function useChannels(): ChannelsResult {
    const { loading: subscriptionsLoading, subscriptions } = useSubscriptions();
    const { loading: topicsLoading, topics } = useTopics();

    const owned = useMemo(() => {
        const subscribedNames = new Set(
            subscriptions.map((subscription) => subscription.topic.name),
        );

        return topics.filter((topic) => !subscribedNames.has(topic.name));
    }, [subscriptions, topics]);

    return {
        loading: subscriptionsLoading || topicsLoading,
        owned,
        subscriptions,
    };
}
