import type { Subscription, TopicMetrics } from '#/lib/api';

import { Skeleton } from '#/components/ui/skeleton';

interface Props {
    loading?: boolean;
    metrics: null | TopicMetrics;
    subscription: null | Subscription;
}

interface StatItemProps {
    label: string;
    loading: boolean;
    subtitle: string;
    value: string;
}

export function StatsStrip({ loading = false, metrics, subscription }: Props) {
    const volume = metrics?.volume ?? Array<number>(24).fill(0);
    const max = Math.max(...volume, 1);

    return (
        <div className="grid shrink-0 grid-cols-2 items-center gap-4 border-b border-line px-4 py-3 sm:grid-cols-3 lg:grid-cols-[repeat(4,1fr)_1.4fr] lg:gap-5.5 lg:px-5.5 lg:py-4.5">
            <StatItem
                label="last 24h"
                loading={loading}
                subtitle="total messages"
                value={metrics ? String(metrics.messageCount24h) : '—'}
            />

            <StatItem
                label="p5 events"
                loading={loading}
                subtitle="max priority"
                value={metrics ? String(metrics.p5Count24h) : '—'}
            />

            <StatItem
                label="subscribers"
                loading={loading}
                subtitle="devices"
                value={metrics ? String(metrics.subscriberCount) : '—'}
            />

            <StatItem
                label="topic"
                loading={loading}
                subtitle={subscription?.topic.accessMode ?? 'public'}
                value={subscription?.topic.displayName ?? '—'}
            />

            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
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

function StatItem({ label, loading, subtitle, value }: StatItemProps) {
    return (
        <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[1.4px] text-dim">
                {label}
            </p>

            {loading ? (
                <Skeleton className="my-1" height={22} width="60%" />
            ) : (
                <p className="m-0 truncate text-[24px] font-semibold tracking-[-0.6px]">{value}</p>
            )}

            <p className="m-0 mt-0.5 font-mono text-[10.5px] text-faint">{subtitle}</p>
        </div>
    );
}
