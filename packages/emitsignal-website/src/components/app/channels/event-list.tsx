import { Dot } from '#/components/ui/dot';
import { cn } from '#/lib/cn';

interface ChannelEvent {
    active?: boolean;
    body: string;
    priority: number;
    tags: string[];
    time: string;
    title: string;
}

const EVENTS: ChannelEvent[] = [
    {
        active: true,
        body: 'mem.used > 92% for 5m · resolved-auto',
        priority: 5,
        tags: ['sev2'],
        time: '21:52',
        title: 'High memory on api-02',
    },
    {
        body: 'p99 2.4s · query plan attached',
        priority: 4,
        tags: ['db'],
        time: '21:48',
        title: 'Slow query · users.find',
    },
    {
        body: '/var/log at 94% — rotated',
        priority: 5,
        tags: ['sev2', 'auto'],
        time: '21:34',
        title: 'Disk pressure · api-03',
    },
    {
        body: 'cdn.acme.io — auto-renew failed',
        priority: 4,
        tags: ['tls'],
        time: '20:11',
        title: 'TLS cert expiring · 7d',
    },
    {
        body: 'stripe webhook · 80% of quota',
        priority: 3,
        tags: ['stripe'],
        time: '19:02',
        title: 'Rate limit warning',
    },
    {
        body: 'load 12.4 for 8m · drained',
        priority: 5,
        tags: ['sev2', 'resolved'],
        time: '17:50',
        title: 'CPU saturation · worker-7',
    },
];

export function EventList() {
    return (
        <div className="min-w-0 flex-1 overflow-auto border-r border-line">
            <FilterRow />
            {EVENTS.map((event, i) => (
                <EventRow event={event} key={i} />
            ))}
        </div>
    );
}

function EventRow({ event }: { event: ChannelEvent }) {
    return (
        <div
            className={cn(
                'flex gap-3 border-b border-line px-5.5 py-3 border-l-[3px]',
                event.active ? 'border-l-accent bg-elev' : 'border-l-transparent',
            )}
        >
            <Dot level={event.priority} size={7} />
            <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-baseline gap-2.5">
                    <span className="text-[13.5px] font-semibold">{event.title}</span>
                    <span className="ml-auto font-mono text-[10.5px] text-dim">{event.time}</span>
                </div>
                <p className="m-0 mb-1.5 text-[12.5px] text-muted">{event.body}</p>
                <div className="flex gap-1.5">
                    {event.tags.map((t) => (
                        <span
                            className="rounded border border-line bg-chip px-1.5 py-0.5 font-mono text-[10px] text-muted"
                            key={t}
                        >
                            {t}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function FilterRow() {
    return (
        <div className="flex items-center gap-3 px-5.5 py-2.5 font-mono text-[10px] tracking-[1.4px] text-dim">
            <span>RECENT</span>
            <span className="text-faint">·</span>
            <span className="text-muted">filter:</span>
            <span className="rounded border border-line bg-chip px-1.5 py-0.5 text-accent">
                priority:&gt;=4
            </span>
            <span className="rounded border border-line bg-chip px-1.5 py-0.5">tag:sev2</span>
            <span className="ml-auto">6 of 142</span>
        </div>
    );
}
