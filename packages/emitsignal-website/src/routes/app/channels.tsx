import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

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

interface Toast {
    kind: 'danger' | 'ok' | 'warn';
    msg: string;
}

function ChannelToast({ toast }: { toast: Toast }) {
    const color =
        toast.kind === 'danger'
            ? 'var(--color-danger)'
            : toast.kind === 'warn'
              ? 'var(--color-warn)'
              : 'var(--color-success)';

    return (
        <div
            className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2"
            style={{ animation: 'ktoast .2s ease-out' }}
        >
            <div
                className="flex items-center gap-2.5 rounded-[10px] border px-4 py-2.5 shadow-2xl"
                style={{
                    background: 'var(--color-elev-2)',
                    borderColor: color + '55',
                }}
            >
                <span
                    className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
                    style={{ background: color, boxShadow: `0 0 10px ${color}` }}
                />
                <span className="text-[13px] text-fg">{toast.msg}</span>
            </div>

            <style>{`@keyframes ktoast{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
        </div>
    );
}

function ChannelView() {
    const { priority, tags, topic } = Route.useSearch();
    const { subscriptions } = useSubscriptions();
    const navigate = useNavigate();

    const [toast, setToast] = useState<null | Toast>(null);
    const toastTimer = useRef<null | ReturnType<typeof setTimeout>>(null);

    const flash = (message: string, kind: Toast['kind'] = 'ok') => {
        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
        }

        setToast({ kind, msg: message });

        toastTimer.current = setTimeout(() => setToast(null), 2400);
    };

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
                            onFlash={flash}
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

            {toast && <ChannelToast toast={toast} />}
        </>
    );
}
