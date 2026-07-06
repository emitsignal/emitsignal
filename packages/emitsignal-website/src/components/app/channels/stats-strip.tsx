import type { Subscription, TopicMetrics } from '#/lib/api';

interface Props {
    metrics: null | TopicMetrics;
    subscription: null | Subscription;
}

export function StatsStrip({ metrics, subscription }: Props) {
    const volume = metrics?.volume ?? Array<number>(24).fill(0);
    const max = Math.max(...volume, 1);

    return (
        <div className="grid shrink-0 grid-cols-[repeat(4,1fr)_1.4fr] items-center gap-5.5 border-b border-line px-5.5 py-4.5">
            <StatItem
                label="last 24h"
                subtitle="total messages"
                value={metrics ? String(metrics.messageCount24h) : '—'}
            />

            <StatItem
                label="p5 events"
                subtitle="max priority"
                value={metrics ? String(metrics.p5Count24h) : '—'}
            />

            <StatItem
                label="subscribers"
                subtitle="devices"
                value={metrics ? String(metrics.subscriberCount) : '—'}
            />

            <StatItem
                label="topic"
                subtitle={subscription?.topic.accessMode ?? 'public'}
                value={subscription?.topic.displayName ?? '—'}
            />

            <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[1.4px] text-dim">
                    VOLUME · 24H
                </p>

                <svg
                    height="56"
                    preserveAspectRatio="none"
                    viewBox={`0 0 ${volume.length * 8} 56`}
                    width="100%"
                >
                    {volume.map((value, index) => {
                        const isRecent = index >= volume.length - 4;
                        const color = isRecent ? 'var(--color-danger)' : 'var(--color-accent)';
                        const opacity = isRecent ? 0.9 : 0.55;
                        const hoursAgo = volume.length - 1 - index;
                        const label = hoursAgo === 0 ? 'this hour' : `${hoursAgo}h ago`;

                        return (
                            <g key={index} style={{ cursor: 'default' }}>
                                <title>{`${value} message${value !== 1 ? 's' : ''} · ${label}`}</title>
                                <rect
                                    fill="transparent"
                                    height={56}
                                    width={8}
                                    x={index * 8}
                                    y={0}
                                />
                                {value === 0 ? (
                                    <rect
                                        fill={color}
                                        height={2}
                                        opacity={opacity * 0.35}
                                        rx="1"
                                        width="6"
                                        x={index * 8}
                                        y={54}
                                    />
                                ) : (
                                    <rect
                                        fill={color}
                                        height={(value / max) * 52}
                                        opacity={opacity}
                                        rx="1"
                                        width="6"
                                        x={index * 8}
                                        y={56 - (value / max) * 52}
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

function StatItem({ label, subtitle, value }: { label: string; subtitle: string; value: string }) {
    return (
        <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[1.4px] text-dim">
                {label}
            </p>

            <p className="m-0 truncate text-[24px] font-semibold tracking-[-0.6px]">{value}</p>
            <p className="m-0 mt-0.5 font-mono text-[10.5px] text-faint">{subtitle}</p>
        </div>
    );
}
