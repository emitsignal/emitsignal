import { priorityHex } from '#/lib/priority';

interface StreamEvent {
    channel: string;
    color: string;
    message: string;
    priority: number;
    time: string;
}

const STREAM: StreamEvent[] = [
    {
        channel: 'deploy/prod',
        color: 'var(--color-accent)',
        message: 'Deploy succeeded · api-gateway → v2.14.3',
        priority: 4,
        time: '21:52:01',
    },
    {
        channel: 'alerts/prod',
        color: 'var(--color-danger)',
        message: 'Production API latency spike, p99 6.4s',
        priority: 5,
        time: '21:52:14',
    },
    {
        channel: 'ci/web',
        color: 'var(--color-success)',
        message: 'Build passed · feat/oauth-pkce (247 tests)',
        priority: 3,
        time: '21:52:22',
    },
    {
        channel: 'github/acme',
        color: 'var(--color-info)',
        message: 'PR #482 reviewed by maya, approved',
        priority: 2,
        time: '21:53:44',
    },
    {
        channel: 'cron/backup',
        color: 'var(--color-warn)',
        message: 'nightly-backup.sh ✓ (14.2 GB → s3)',
        priority: 3,
        time: '21:55:02',
    },
    {
        channel: 'errors/web',
        color: 'var(--color-danger)',
        message: 'TypeError spike · 34 events in 2m',
        priority: 5,
        time: '21:58:11',
    },
    {
        channel: 'stripe/payments',
        color: 'var(--color-accent)',
        message: 'webhook · invoice.paid · $4,820.00',
        priority: 3,
        time: '22:00:00',
    },
    {
        channel: 'ci/api',
        color: 'var(--color-success)',
        message: 'Build passed · main · 312 tests · 41s',
        priority: 3,
        time: '22:01:18',
    },
    {
        channel: 'home/sensors',
        color: 'var(--color-warn)',
        message: 'Garage door open for 12m',
        priority: 2,
        time: '22:02:44',
    },
    {
        channel: 'github/acme',
        color: 'var(--color-info)',
        message: 'New issue · #1284 · "auth flow stuck"',
        priority: 2,
        time: '22:03:09',
    },
    {
        channel: 'deploy/prod',
        color: 'var(--color-accent)',
        message: 'Canary rollout · 10% traffic shifted',
        priority: 4,
        time: '22:04:00',
    },
    {
        channel: 'alerts/prod',
        color: 'var(--color-danger)',
        message: 'TLS cert expiring · cdn.acme.io · 7d',
        priority: 5,
        time: '22:05:32',
    },
];

interface HeroTerminalProps {
    streamHeight?: number;
}

export function HeroTerminal({ streamHeight = 360 }: HeroTerminalProps = {}) {
    const events = [...STREAM, ...STREAM];

    return (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-deep shadow-[0_30px_80px_rgba(91,33,182,0.13),0_0_0_1px_rgba(167,139,250,0.13)]">
            {/* titlebar */}
            <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
                <span className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-term-red" />
                    <span className="h-2.5 w-2.5 rounded-full bg-term-amber" />
                    <span className="h-2.5 w-2.5 rounded-full bg-term-green" />
                </span>
                <span className="ml-3 font-mono text-[11.5px] text-dim">
                    emitsignal listen · 8 channels live
                </span>
                <span className="ml-auto flex items-center gap-1.5 font-mono text-[10.5px] text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]" />
                    sse · connected
                </span>
            </div>

            {/* prompt */}
            <div className="px-4.5 pb-1.5 pt-3.5 font-mono text-[12.5px]">
                <span className="text-success">$</span>{' '}
                <span className="text-fg">emitsignal listen --priority &gt;=2 --format pretty</span>
            </div>

            {/* scrolling stream */}
            <div
                className="relative overflow-hidden"
                style={{
                    height: streamHeight,
                    maskImage:
                        'linear-gradient(180deg, transparent, black 12%, black 70%, transparent)',
                    WebkitMaskImage:
                        'linear-gradient(180deg, transparent, black 12%, black 70%, transparent)',
                }}
            >
                <div
                    className="will-change-transform"
                    style={{ animation: 'signal-stream 28s linear infinite' }}
                >
                    {events.map((event, index) => (
                        <StreamRow event={event} key={index} />
                    ))}
                </div>
            </div>

            {/* prompt caret */}
            <div className="flex items-center border-t border-line px-4.5 py-3 font-mono text-[12px] text-accent">
                <span>$</span>
                <span
                    className="ml-1 inline-block h-3 w-[7px] bg-accent align-middle"
                    style={{ animation: 'signal-caret 1s steps(2) infinite' }}
                />
            </div>
        </div>
    );
}

function StreamRow({ event }: { event: StreamEvent }) {
    return (
        <div className="flex gap-3 px-4.5 py-1 font-mono text-[12.2px]">
            <span className="text-faint">{event.time}</span>
            <span style={{ color: event.color }}>●</span>
            <span className="w-[140px] shrink-0 truncate text-dim">{event.channel}</span>
            <span className="text-faint" style={{ color: priorityHex(event.priority) }}>
                p{event.priority}
            </span>
            <span className="min-w-0 flex-1 truncate text-fg">{event.message}</span>
        </div>
    );
}
