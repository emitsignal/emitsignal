import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Crown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ChannelActionsMenu } from '#/components/app/channels/channel-actions-menu';
import { EventList } from '#/components/app/channels/event-list';
import { RoutingRail } from '#/components/app/channels/routing-rail';
import { StatsStrip } from '#/components/app/channels/stats-strip';
import { Toolbar } from '#/components/app/toolbar';
import { Dot } from '#/components/ui/dot';
import { Skeleton } from '#/components/ui/skeleton';
import { useChannels } from '#/hooks/use-channels';
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

function ChannelPill({
    name,
    onSelect,
    owned,
    selected,
}: {
    name: string;
    onSelect: () => void;
    owned?: boolean;
    selected: boolean;
}) {
    return (
        <button
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11.5px] ${
                selected ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-elev'
            }`}
            onClick={onSelect}
        >
            {owned && (
                <span className="flex flex-shrink-0" title="You own this topic">
                    <Crown className={selected ? 'text-accent' : 'text-dim'} size={11} />
                </span>
            )}
            {name}
        </button>
    );
}

function ChannelView() {
    const { priority, tags, topic } = Route.useSearch();
    const { loading: channelsLoading, owned, subscriptions } = useChannels();
    const navigate = useNavigate();

    const selectedTopic = topic || subscriptions[0]?.topic.name || owned[0]?.name || '';
    const filters = { minPriority: priority, tags };

    const { addMessage, loading: metricsLoading, metrics } = useTopicMetrics(selectedTopic || null);
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
    const selectedTopicRecord =
        subscription?.topic ?? owned.find((topic) => topic.name === selectedTopic);

    return (
        <>
            <Toolbar
                actions={
                    selectedTopicRecord && (
                        <ChannelActionsMenu
                            onRemoved={() =>
                                navigate({
                                    search: { priority, tags, topic: '' },
                                    to: '/app/channels',
                                })
                            }
                            subscription={subscription}
                            topic={selectedTopicRecord}
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
                        {selectedTopicRecord && !subscription && (
                            <span className="font-mono text-[11px] font-normal text-dim">
                                not subscribed
                            </span>
                        )}
                    </span>
                }
            />

            <div className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-3">
                {channelsLoading &&
                    [72, 96, 64].map((width) => (
                        <Skeleton height={24} key={width} radius={12} width={width} />
                    ))}

                {!channelsLoading && subscriptions.length === 0 && owned.length === 0 && (
                    <span className="px-1 font-mono text-[11.5px] text-dim">
                        no channels yet · subscribe to one from the inbox
                    </span>
                )}

                {subscriptions.map((subscription) => (
                    <ChannelPill
                        key={subscription.id}
                        name={subscription.topic.name}
                        onSelect={() =>
                            navigate({
                                search: { priority, tags, topic: subscription.topic.name },
                                to: '/app/channels',
                            })
                        }
                        owned={subscription.topic.isOwner}
                        selected={subscription.topic.name === selectedTopic}
                    />
                ))}

                {owned.length > 0 && subscriptions.length > 0 && (
                    <span aria-hidden className="h-4 w-px bg-line" />
                )}

                {owned.map((topic) => (
                    <ChannelPill
                        key={topic.id}
                        name={topic.name}
                        onSelect={() =>
                            navigate({
                                search: { priority, tags, topic: topic.name },
                                to: '/app/channels',
                            })
                        }
                        owned={topic.isOwner}
                        selected={topic.name === selectedTopic}
                    />
                ))}
            </div>

            <StatsStrip
                loading={channelsLoading || metricsLoading}
                metrics={metrics ?? null}
                subscription={subscription ?? null}
            />

            <div className="flex min-h-0 flex-1">
                <EventList
                    emptyLabel={
                        selectedTopic
                            ? 'no messages in this channel'
                            : 'subscribe to a channel to see its events'
                    }
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
