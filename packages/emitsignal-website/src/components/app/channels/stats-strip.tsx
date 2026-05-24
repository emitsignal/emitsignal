import type { Message, Subscription } from '#/lib/api';

const VOLUME = [
    12, 10, 14, 11, 15, 18, 22, 19, 25, 32, 28, 40, 38, 52, 48, 61, 68, 72, 80, 76, 68, 54, 42, 38,
];

interface Props {
    messages: Message[];
    subscription: null | Subscription;
}

export function StatsStrip({ messages, subscription }: Props) {
    const p5Count = messages.filter((message) => message.priority === 5).length;

    const max = Math.max(...VOLUME);

    return (
        <div className="grid shrink-0 grid-cols-[repeat(4,1fr)_1.4fr] items-center gap-5.5 border-b border-line px-5.5 py-4.5">
            <StatItem label="last 24h" sub="total messages" value={String(messages.length)} />
            <StatItem label="p5 events" sub="max priority" value={String(p5Count)} />
            <StatItem label="subscribers" sub="devices" value={subscription ? '1+' : '0'} />
            <StatItem
                label="topic"
                sub={subscription?.topic.isPublic ? 'public' : 'private'}
                value={subscription?.topic.displayName ?? '—'}
            />
            <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[1.4px] text-dim">
                    VOLUME · 24H
                </p>
                <svg
                    height="56"
                    preserveAspectRatio="none"
                    viewBox={`0 0 ${VOLUME.length * 8} 56`}
                    width="100%"
                >
                    {VOLUME.map((v, i) => (
                        <rect
                            fill={
                                i >= VOLUME.length - 4
                                    ? 'var(--color-danger)'
                                    : 'var(--color-accent)'
                            }
                            height={(v / max) * 52}
                            key={i}
                            opacity={i >= VOLUME.length - 4 ? 0.9 : 0.55}
                            rx="1"
                            width="6"
                            x={i * 8}
                            y={56 - (v / max) * 52}
                        />
                    ))}
                </svg>
            </div>
        </div>
    );
}

function StatItem({ label, sub, value }: { label: string; sub: string; value: string }) {
    return (
        <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[1.4px] text-dim">
                {label}
            </p>
            <p className="m-0 truncate text-[24px] font-semibold tracking-[-0.6px]">{value}</p>
            <p className="m-0 mt-0.5 font-mono text-[10.5px] text-faint">{sub}</p>
        </div>
    );
}
