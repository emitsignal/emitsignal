import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { ChannelActionsMenu } from '#/components/app/channels/channel-actions-menu';
import { EventList } from '#/components/app/channels/event-list';
import { RoutingRail } from '#/components/app/channels/routing-rail';
import { StatsStrip } from '#/components/app/channels/stats-strip';
import { Toolbar } from '#/components/app/toolbar';
import { Dot } from '#/components/ui/dot';
import { useSubscriptions } from '#/ctx/subscriptions';
import { useTopicMessages, useTopicMetrics } from '#/hooks/use-emit-signal';

export const Route = createFileRoute('/app/channels')({
    component: ChannelView,
    validateSearch: (search: Record<string, unknown>) => {
        const rawPriority = Number(search.priority);
        const priority =
            Number.isInteger(rawPriority) && rawPriority >= 1 && rawPriority <= 5
                ? rawPriority
                : undefined;
        // TanStack Router JSON-decodes search values by default, so an array
        // set via `navigate({ search: { tags: [...] } })` arrives here as an
        // actual array. Comma-separated strings are still accepted so a
        // hand-typed URL (e.g. `?tags=sev2,infra`) keeps working.
        const tags = Array.isArray(search.tags)
            ? search.tags.filter((tag): tag is string => typeof tag === 'string')
            : typeof search.tags === 'string'
              ? search.tags
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)
              : [];

        return {
            priority,
            tags,
            topic: (search.topic as string) ?? '',
        };
    },
});

function ChannelView() {
    const { priority, tags, topic } = Route.useSearch();
    const { subscriptions } = useSubscriptions();
    const navigate = useNavigate();

    const selectedTopic = topic || subscriptions[0]?.topic.name || '';
    const filters = { minPriority: priority, tags };

    const { addMessage, metrics } = useTopicMetrics(selectedTopic || null);
    const { fetchNextPage, hasNextPage, isFetchingNextPage, loading, messages } = useTopicMessages(
        selectedTopic || null,
        addMessage,
        filters,
    );

    const [tagOptions, setTagOptions] = useState<string[]>([]);

    useEffect(() => {
        setTagOptions([]);
    }, [selectedTopic]);

    useEffect(() => {
        if (messages.length === 0) {
            return;
        }

        setTagOptions((previous) => {
            const next = new Set(previous);
            messages.forEach((message) => message.tags?.forEach((tag) => next.add(tag)));
            return next.size === previous.length ? previous : Array.from(next).sort();
        });
    }, [messages]);

    const subscription = subscriptions.find(
        (subscription) => subscription.topic.name === selectedTopic,
    );
    const matchingSubscriptions = subscriptions.filter(
        (subscription) => subscription.topic.name === selectedTopic,
    );

    return (
        <>
            <Toolbar
                actions={
                    subscription && (
                        <ChannelActionsMenu
                            onUnsubscribed={() =>
                                navigate({
                                    search: { priority, tags, topic: '' },
                                    to: '/app/channels',
                                })
                            }
                            subscription={subscription}
                            topicName={selectedTopic}
                        />
                    )
                }
                subtitle={`${messages.length}${hasNextPage ? '+' : ''} messages · ${matchingSubscriptions.length} subscriber${matchingSubscriptions.length !== 1 ? 's' : ''}`}
                title={
                    <span className="flex items-center gap-2.5">
                        <span className="font-normal text-dim">Channels /</span>
                        <span>{selectedTopic || 'select a channel'}</span>
                        {subscription && <Dot level={1} />}
                    </span>
                }
            />

            <div className="flex flex-wrap gap-4 border-b border-line px-5 py-3">
                {subscriptions.map((subscription) => (
                    <button
                        className={`rounded-full px-3 py-1 font-mono text-[11.5px] ${
                            subscription.topic.name === selectedTopic
                                ? 'bg-accent/10 text-accent'
                                : 'text-muted hover:bg-elev'
                        }`}
                        key={subscription.id}
                        onClick={() =>
                            navigate({
                                search: { priority, tags, topic: subscription.topic.name },
                                to: '/app/channels',
                            })
                        }
                    >
                        {subscription.topic.name}
                    </button>
                ))}
            </div>

            <StatsStrip metrics={metrics ?? null} subscription={subscription ?? null} />

            <div className="flex min-h-0 flex-1">
                <EventList
                    fetchNextPage={fetchNextPage}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    loading={loading}
                    messages={messages}
                    onClear={() =>
                        navigate({
                            search: { priority: undefined, tags: [], topic: selectedTopic },
                            to: '/app/channels',
                        })
                    }
                    onPriorityChange={(nextPriority) =>
                        navigate({
                            search: { priority: nextPriority, tags, topic: selectedTopic },
                            to: '/app/channels',
                        })
                    }
                    onTagClick={(tag) =>
                        navigate({
                            search: { priority, tags: [tag], topic: selectedTopic },
                            to: '/app/channels',
                        })
                    }
                    onTagsChange={(nextTags) =>
                        navigate({
                            search: { priority, tags: nextTags, topic: selectedTopic },
                            to: '/app/channels',
                        })
                    }
                    priority={priority}
                    tagOptions={tagOptions}
                    tags={tags}
                />

                <RoutingRail subscription={subscription ?? null} />
            </div>
        </>
    );
}
