interface Stat {
    label: string;
    sub: string;
    value: string;
}

const STATS: Stat[] = [
    { label: 'last 24h', sub: '+18 vs prev', value: '142' },
    { label: 'p5 events', sub: '2 active', value: '6' },
    { label: 'avg latency', sub: 'p99 312ms', value: '124ms' },
    { label: 'ack rate', sub: '12 → on-call', value: '88%' },
];

const VOLUME = [
    12, 10, 14, 11, 15, 18, 22, 19, 25, 32, 28, 40, 38, 52, 48, 61, 68, 72, 80, 76, 68, 54, 42, 38,
];

export function StatsStrip() {
    const max = Math.max(...VOLUME);
    return (
        <div className="grid shrink-0 grid-cols-[repeat(4,1fr)_1.4fr] items-center gap-5.5 border-b border-line px-5.5 py-4.5">
            {STATS.map((s) => (
                <div key={s.label}>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[1.4px] text-dim">
                        {s.label}
                    </p>
                    <p className="m-0 text-[24px] font-semibold tracking-[-0.6px]">{s.value}</p>
                    <p className="m-0 mt-0.5 font-mono text-[10.5px] text-faint">{s.sub}</p>
                </div>
            ))}
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
