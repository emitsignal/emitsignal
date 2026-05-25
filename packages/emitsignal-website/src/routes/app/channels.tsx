import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { EventList } from '#/components/app/channels/event-list';
import { RoutingRail } from '#/components/app/channels/routing-rail';
import { StatsStrip } from '#/components/app/channels/stats-strip';
import { Toolbar } from '#/components/app/toolbar';
import { Dot } from '#/components/ui/dot';
import { useSubscriptions } from '#/ctx/subscriptions';
import { useTopicMessages } from '#/hooks/use-emit-signal';

export const Route = createFileRoute('/app/channels')({
    component: ChannelView,
    validateSearch: (search: Record<string, unknown>) => ({
        topic: (search.topic as string) ?? '',
    }),
});

function ChannelView() {
    const { topic } = Route.useSearch();

    const { loading, messages } = useTopicMessages(topic || null);
    const { subscriptions, unsubscribe } = useSubscriptions();
    const navigate = useNavigate();

    const selectedTopic = topic || subscriptions[0]?.topic.name || '';

    const subscription = subscriptions.find((s) => s.topic.name === selectedTopic);
    const subs = subscriptions.filter((s) => s.topic.name === selectedTopic);

    return (
        <>
            <Toolbar
                actions={
                    subscription ? (
                        <button
                            className="rounded-md border border-line px-2.5 py-1 font-mono text-[12px] text-muted hover:bg-elev"
                            onClick={() => unsubscribe(selectedTopic)}
                        >
                            unsubscribe
                        </button>
                    ) : null
                }
                subtitle={`${messages.length} messages · ${subs.length} subscriber${subs.length !== 1 ? 's' : ''}`}
                title={
                    <span className="flex items-center gap-2.5">
                        <span className="font-normal text-dim">Channels /</span>
                        <span>{selectedTopic || 'select a channel'}</span>
                        {subscription && <Dot level={1} />}
                    </span>
                }
            />

            <div className="flex flex-wrap gap-4 border-b border-line px-5 py-3">
                {subscriptions.map((s) => (
                    <button
                        className={`rounded-full px-3 py-1 font-mono text-[11.5px] ${
                            s.topic.name === selectedTopic
                                ? 'bg-accent/10 text-accent'
                                : 'text-muted hover:bg-elev'
                        }`}
                        key={s.id}
                        onClick={() =>
                            navigate({ search: { topic: s.topic.name }, to: '/app/channels' })
                        }
                    >
                        {s.topic.name}
                    </button>
                ))}
            </div>

            <StatsStrip messages={messages} subscription={subscription ?? null} />

            <div className="flex min-h-0 flex-1">
                <EventList loading={loading} messages={messages} />
                <RoutingRail subscription={subscription ?? null} />
            </div>
        </>
    );
}
