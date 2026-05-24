import { createFileRoute } from '@tanstack/react-router';

import { EventList } from '#/components/app/channels/event-list';
import { RoutingRail } from '#/components/app/channels/routing-rail';
import { StatsStrip } from '#/components/app/channels/stats-strip';
import { Toolbar } from '#/components/app/toolbar';
import { Dot } from '#/components/ui/dot';

export const Route = createFileRoute('/app/channels')({ component: ChannelView });

function ChannelView() {
    return (
        <>
            <Toolbar
                actions={
                    <div className="flex gap-2">
                        <button className="rounded-md border border-line px-2.5 py-1 font-mono text-[12px] text-muted hover:bg-elev">
                            mute 1h
                        </button>
                        <button className="rounded-md bg-accent px-2.5 py-1 text-[12px] font-semibold text-bg hover:bg-accent-dim">
                            Subscribed
                        </button>
                    </div>
                }
                subtitle="23 messages · 4 subscribers · public:false"
                title={
                    <span className="flex items-center gap-2.5">
                        <span className="font-normal text-dim">Channels /</span>
                        <span>alerts/prod</span>
                        <Dot level={5} />
                    </span>
                }
            />

            <StatsStrip />

            <div className="flex min-h-0 flex-1">
                <EventList />
                <RoutingRail />
            </div>
        </>
    );
}
