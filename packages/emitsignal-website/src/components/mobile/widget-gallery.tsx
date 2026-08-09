import { useState } from 'react';

import { Dot } from '#/components/ui/dot';
import { Logo } from '#/components/ui/logo';
import { cn } from '#/lib/cn';

type Family = 'accessory' | 'large' | 'medium' | 'small';

interface WidgetVariant {
    family: Family;
    meta: string;
    name: string;
    render: () => React.ReactNode;
}

const FAMILY_ORDER: Family[] = ['small', 'medium', 'large', 'accessory'];

const FAMILY_META: Record<Family, { label: string; sub: string }> = {
    accessory: { label: 'Lock Screen', sub: 'accessory family · on wallpaper' },
    large: { label: 'Large', sub: '4×4 · 338×354pt' },
    medium: { label: 'Medium', sub: '4×2 · 338×158pt' },
    small: { label: 'Small', sub: '2×2 · 158pt' },
};

/** Activity · large feed. */
function ActivityLarge() {
    const rows: Array<[string, string, string, number]> = [
        ['alerts', 'latency p99 over 800ms', '14:31', 5],
        ['deploys', 'v2.4.0 shipped to prod', '14:24', 3],
        ['ci', 'build passed → prod', '14:23', 2],
        ['billing', 'invoice #2231 paid', '13:58', 2],
        ['ci', 'flaky test retried ok', '13:40', 1],
    ];

    return (
        <Frame height={354} width={338}>
            <div className="flex h-full flex-col">
                <div className="flex items-center gap-2">
                    <Logo label="signals" size={14} />
                    <span className="ml-auto rounded-full bg-accent-dim px-2.5 py-0.5 text-[12px] font-bold text-fg">
                        12 new
                    </span>
                </div>

                <div className="mt-2 flex flex-1 flex-col">
                    {rows.map(([channel, title, time, level], index) => (
                        <div
                            className="flex items-center gap-2.5 border-t border-line py-[11px]"
                            key={`${title}-${index}`}
                        >
                            <TopicAvatar name={channel} rounded={8} size={30} />
                            <div className="min-w-0 flex-1">
                                <p className="m-0 truncate text-[13.5px] tracking-[-0.2px] text-fg">
                                    {title}
                                </p>
                                <p className="m-0 mt-px font-mono text-[10.5px] text-dim">
                                    {channel} · {time}
                                </p>
                            </div>
                            <Dot level={level} size={8} />
                        </div>
                    ))}
                </div>

                <p className="m-0 mt-1 flex items-center gap-1.5 font-mono text-[11px] text-success">
                    <LiveDot /> live · alerts/prod
                </p>
            </div>
        </Frame>
    );
}

/** Activity · recent three. */
function ActivityMedium() {
    const rows: Array<[string, string, string, number]> = [
        ['deploys', 'v2.4.0 shipped to prod', '14:24', 3],
        ['ci', 'build passed → prod', '14:23', 2],
        ['alerts', 'latency p99 over 800ms', '14:31', 5],
    ];

    return (
        <Frame height={158} width={338}>
            <Head
                right={
                    <span className="flex items-center gap-[5px] font-mono text-[10px] text-success">
                        <LiveDot /> live
                    </span>
                }
            />

            <div className="mt-2.5 flex flex-col">
                {rows.map(([channel, title, time, level], index) => (
                    <div
                        className={cn(
                            'flex items-center gap-[9px] py-[7px]',
                            index > 0 && 'border-t border-line',
                        )}
                        key={title}
                    >
                        <Dot level={level} size={8} />
                        <span className="w-14 shrink-0 font-mono text-[11px] text-dim">
                            {channel}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px] text-fg">{title}</span>
                        <span className="font-mono text-[10px] text-faint">{time}</span>
                    </div>
                ))}
            </div>
        </Frame>
    );
}

/** Channels · grid with unread counts. */
function ChannelsMedium() {
    const channels: Array<[string, number, number]> = [
        ['alerts', 3, 5],
        ['deploys', 1, 3],
        ['ci', 0, 2],
        ['billing', 2, 4],
    ];

    return (
        <Frame height={158} width={338}>
            <Head right={<span className="font-mono text-[10px] text-dim">channels</span>} />

            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                {channels.map(([name, count, level]) => (
                    <div
                        className="flex items-center gap-[9px] rounded-[10px] border border-line bg-white/[0.03] px-[9px] py-[7px]"
                        key={name}
                    >
                        <TopicAvatar name={name} rounded={7} size={26} />
                        <span className="font-mono text-[12px] tracking-[-0.2px] text-muted">
                            {name}
                        </span>
                        {count > 0 ? (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-dim text-[12px] font-bold text-fg">
                                {count}
                            </span>
                        ) : (
                            <span className="ml-auto">
                                <Dot level={level} size={7} />
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </Frame>
    );
}

/** The widget container: true point size, hairline border, WidgetKit corner radius. */
function Frame({
    children,
    height,
    width,
}: {
    children: React.ReactNode;
    height: number;
    width: number;
}) {
    return (
        <div
            className="relative box-border overflow-hidden border border-line p-4 text-fg shadow-[0_20px_44px_-22px_rgba(0,0,0,0.75)]"
            style={{
                background: 'linear-gradient(165deg, #141517 0%, #0a0a0c 100%)',
                borderRadius: width <= 170 ? 24 : 28,
                height,
                width,
            }}
        >
            {children}
        </div>
    );
}

// ─────────────────────────────── small · 158 ───────────────────────────────

/** Tiny mark + wordmark, the header several widgets share. */
function Head({ right }: { right?: React.ReactNode }) {
    return (
        <div className="flex items-center gap-[7px]">
            <Logo label="emitsignal" size={12} />
            {right ? <span className="ml-auto">{right}</span> : null}
        </div>
    );
}

/** Latest Signal · full card. */
function LatestMedium() {
    return (
        <Frame height={158} width={338}>
            <div className="flex h-full flex-col">
                <Head right={<span className="font-mono text-[10px] text-dim">14:31</span>} />

                <div className="mt-3.5 flex items-center gap-3">
                    <TopicAvatar name="alerts" rounded={10} size={42} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <Dot level={5} size={8} />
                            <span className="font-mono text-[12px] text-dim">alerts/prod</span>
                            <span className="ml-auto font-mono text-[11px] text-danger">p5</span>
                        </div>
                        <p className="m-0 mt-1 text-[18px] tracking-[-0.3px] text-fg">
                            latency p99 over 800ms
                        </p>
                    </div>
                </div>

                <div className="mt-auto flex items-center justify-between">
                    <span className="font-mono text-[11px] text-dim">11 more · 4 channels</span>
                    <span className="font-mono text-[11px] text-accent">open →</span>
                </div>
            </div>
        </Frame>
    );
}

/** Latest Signal · rectangular. */
function LatestRectangular() {
    return (
        <div className="flex h-[76px] w-[168px] flex-col justify-center gap-1 text-white">
            <div className="flex items-center gap-1.5">
                <span className="h-[7px] w-[7px] rounded-full bg-white" />
                <span className="font-mono text-[12px] opacity-85">alerts/prod</span>
                <span className="ml-auto font-mono text-[11px] opacity-60">14:31</span>
            </div>
            <p className="m-0 text-[15px] font-semibold tracking-[-0.2px]">
                latency p99 over 800ms
            </p>
            <p className="m-0 font-mono text-[11px] opacity-70">+ 11 more signals</p>
        </div>
    );
}

/** Latest Signal · compact. */
function LatestSmall() {
    return (
        <Frame height={158} width={158}>
            <div className="flex h-full flex-col gap-2.5">
                <div className="flex items-center gap-2">
                    <TopicAvatar name="alerts" rounded={8} size={30} />
                    <div className="min-w-0">
                        <p className="m-0 font-mono text-[11px] text-dim">alerts</p>
                        <p className="m-0 font-mono text-[10px] text-faint">14:31</p>
                    </div>
                    <span className="ml-auto">
                        <Dot level={5} size={9} />
                    </span>
                </div>

                <p className="m-0 text-[15px] leading-[1.3] tracking-[-0.2px] text-fg">
                    latency p99 over 800ms
                </p>

                <p className="m-0 mt-auto font-mono text-[10px] text-dim">+ 11 more today</p>
            </div>
        </Frame>
    );
}

// ────────────────────────────── medium · 338×158 ──────────────────────────────

/** Static by necessity: a WidgetKit timeline renders snapshots, never animation. */
function LiveDot({ size = 6 }: { size?: number }) {
    return (
        <span
            className="inline-block shrink-0 rounded-full bg-success"
            style={{
                boxShadow: `0 0 ${size * 0.8}px color-mix(in srgb, var(--color-success) 60%, transparent)`,
                height: size,
                width: size,
            }}
        />
    );
}

/**
 * Live Status. The design board draws an animated waveform behind a LIVE pill;
 * `LiveStatusWidget.swift` draws a static dot, the state word, the primary
 * topic and a channel count. This follows the Swift.
 */
function LiveSmall() {
    return (
        <Frame height={158} width={158}>
            <div className="flex h-full flex-col">
                <Head />

                <div className="mt-auto flex items-center gap-2">
                    <LiveDot size={10} />
                    <span className="font-mono text-[16px] font-semibold text-success">live</span>
                </div>

                <p className="m-0 mt-2 font-mono text-[15px] tracking-[-0.3px] text-fg">
                    alerts/prod
                </p>
                <p className="m-0 mt-0.5 text-[12px] text-dim">listening · 4 channels</p>
            </div>
        </Frame>
    );
}

/** Stats · large breakdown. */
function StatsLarge() {
    const channels: Array<[string, number, string]> = [
        ['alerts', 9, 'var(--color-danger)'],
        ['deploys', 5, 'var(--color-pink)'],
        ['ci', 3, 'var(--color-success)'],
        ['billing', 2, 'var(--color-accent)'],
    ];

    return (
        <Frame height={354} width={338}>
            <div className="flex h-full flex-col">
                <Head right={<span className="font-mono text-[10px] text-dim">today</span>} />

                <div className="mt-4">
                    <p className="m-0 text-[64px] font-bold leading-[0.9] tracking-[-2.5px] text-fg">
                        78
                    </p>
                    <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-[13px] text-muted">signals today</span>
                        <span className="font-mono text-[11px] text-success">↑ 14%</span>
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                    {channels.map(([name, count, color]) => (
                        <div className="flex items-center gap-2.5" key={name}>
                            <span className="w-14 font-mono text-[12px] text-muted">{name}</span>
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                                <span
                                    className="block h-full rounded-full"
                                    style={{ background: color, width: `${(count / 9) * 100}%` }}
                                />
                            </span>
                            <span className="w-[18px] text-right font-mono text-[12px] text-fg">
                                {count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </Frame>
    );
}

// ────────────────────────────── large · 338×354 ──────────────────────────────

/** Stats · 24h sparkline. */
function StatsSmall() {
    const bars = [3, 5, 4, 7, 6, 9, 5, 8, 12, 7, 10, 6];
    const max = Math.max(...bars);

    return (
        <Frame height={158} width={158}>
            <div className="flex h-full flex-col">
                <Head />

                <p className="m-0 mt-2.5 text-[13px] text-muted">signals · 24h</p>

                <div className="mt-2.5 flex h-11 items-end gap-1">
                    {bars.map((bar, index) => (
                        <span
                            className="flex-1 rounded-sm"
                            key={index}
                            style={{
                                background:
                                    index === bars.length - 3
                                        ? 'var(--color-accent)'
                                        : 'var(--color-accent-deep)',
                                height: `${(bar / max) * 100}%`,
                                opacity: index === bars.length - 3 ? 1 : 0.55,
                            }}
                        />
                    ))}
                </div>

                <div className="mt-auto flex items-baseline gap-1.5">
                    <span className="text-[22px] font-bold text-fg">78</span>
                    <span className="font-mono text-[10px] text-success">↑ 14%</span>
                </div>
            </div>
        </Frame>
    );
}

/** Deterministic topic avatar — same hash-to-hue rule as the design board. */
function TopicAvatar({
    name,
    rounded = 8,
    size = 36,
}: {
    name: string;
    rounded?: number;
    size?: number;
}) {
    let hash = 0;

    for (let index = 0; index < name.length; index += 1) {
        hash = (hash * 31 + name.charCodeAt(index)) & 0xfffff;
    }

    const hue = hash % 360;
    const monogram = name
        .replace(/[^a-z0-9]/gi, '')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div
            className="flex shrink-0 items-center justify-center font-mono font-semibold"
            style={{
                background: `oklch(0.42 0.14 ${hue})`,
                borderRadius: rounded,
                color: `oklch(0.92 0.10 ${hue})`,
                fontSize: size * 0.36,
                height: size,
                letterSpacing: -0.3,
                width: size,
            }}
        >
            {monogram}
        </div>
    );
}

// ───────────────────────────── lock screen accessories ─────────────────────────────

/** Unread · circular gauge. Accessories render monochrome over the wallpaper. */
function UnreadCircular() {
    const size = 76;
    const stroke = 7;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="relative" style={{ height: size, width: size }}>
            <svg className="-rotate-90" height={size} width={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    fill="none"
                    r={radius}
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth={stroke}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    fill="none"
                    r={radius}
                    stroke="#fff"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * 0.28}
                    strokeLinecap="round"
                    strokeWidth={stroke}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-bold leading-none text-white">12</span>
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-white" />
            </div>
        </div>
    );
}

/** Unread · inline, beside the Lock Screen clock. */
function UnreadInline() {
    return (
        <div className="flex h-[76px] items-center gap-[7px] text-white">
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="text-[15px] font-semibold">12 new signals</span>
        </div>
    );
}

/** Unread · hero number. */
function UnreadSmall() {
    return (
        <Frame height={158} width={158}>
            <div className="flex h-full flex-col">
                <Head right={<span className="font-mono text-[10px] text-dim">now</span>} />

                <div className="mt-auto">
                    <p className="m-0 text-[58px] font-bold leading-[0.9] tracking-[-2px] text-fg">
                        12
                    </p>
                    <p className="m-0 mt-1 text-[13px] text-muted">unread signals</p>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                    {[5, 4, 3, 2].map((level) => (
                        <Dot key={level} level={level} size={8} />
                    ))}
                    <span className="ml-auto font-mono text-[10px] text-dim">4 ch</span>
                </div>
            </div>
        </Frame>
    );
}

const VARIANTS: WidgetVariant[] = [
    { family: 'small', meta: 'hero number', name: 'Unread', render: () => <UnreadSmall /> },
    { family: 'small', meta: 'live or idle', name: 'Live Status', render: () => <LiveSmall /> },
    { family: 'small', meta: 'top of feed', name: 'Latest Signal', render: () => <LatestSmall /> },
    { family: 'small', meta: '24h sparkline', name: 'Stats', render: () => <StatsSmall /> },
    { family: 'medium', meta: 'full card', name: 'Latest Signal', render: () => <LatestMedium /> },
    { family: 'medium', meta: 'grid + counts', name: 'Channels', render: () => <ChannelsMedium /> },
    { family: 'medium', meta: 'recent 3', name: 'Activity', render: () => <ActivityMedium /> },
    { family: 'large', meta: 'recent 5 + live', name: 'Activity', render: () => <ActivityLarge /> },
    { family: 'large', meta: 'count + breakdown', name: 'Stats', render: () => <StatsLarge /> },
    { family: 'accessory', meta: 'circular', name: 'Unread', render: () => <UnreadCircular /> },
    {
        family: 'accessory',
        meta: 'rectangular',
        name: 'Latest Signal',
        render: () => <LatestRectangular />,
    },
    { family: 'accessory', meta: 'inline', name: 'Unread', render: () => <UnreadInline /> },
];

export function WidgetGallery() {
    const [filter, setFilter] = useState<'all' | Family>('all');

    const families = FAMILY_ORDER.filter((family) => filter === 'all' || family === filter);

    return (
        <div>
            <div className="flex flex-wrap gap-2">
                {(['all', ...FAMILY_ORDER] as const).map((option) => {
                    const active = option === filter;
                    const count = VARIANTS.filter(
                        (variant) => option === 'all' || variant.family === option,
                    ).length;

                    return (
                        <button
                            aria-pressed={active}
                            className={cn(
                                'rounded-lg border px-3 py-1.5 font-mono text-[11.5px] transition-colors',
                                active
                                    ? 'border-accent/50 bg-accent/12 text-fg'
                                    : 'border-line bg-elev text-dim hover:text-fg',
                            )}
                            key={option}
                            onClick={() => setFilter(option)}
                            type="button"
                        >
                            {option === 'all' ? 'All' : FAMILY_META[option].label}
                            <span className="ml-2 text-faint">{count}</span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-8 flex flex-col gap-11">
                {families.map((family) => (
                    <FamilyGroup family={family} key={family} />
                ))}
            </div>
        </div>
    );
}

function FamilyGroup({ family }: { family: Family }) {
    const variants = VARIANTS.filter((variant) => variant.family === family);
    const { label, sub } = FAMILY_META[family];

    return (
        <div>
            <div className="flex items-baseline gap-3">
                <span className="text-[16px] font-semibold text-fg">{label}</span>
                <span className="font-mono text-[11px] text-dim">{sub}</span>
                <span className="ml-1.5 h-px flex-1 bg-line" />
            </div>

            {/* True point sizes do not reflow, so the row scrolls rather than
                shrinking the widgets away from the sizes they actually are. */}
            <div
                className={cn(
                    '-mx-5 mt-5 overflow-x-auto px-5 sm:-mx-8 sm:px-8 md:mx-0 md:px-0',
                    family === 'accessory' &&
                        'rounded-[20px] border border-line bg-[linear-gradient(135deg,#1c1b22_0%,#0a0a0c_100%)]',
                )}
            >
                <div
                    className={cn(
                        'flex w-max gap-7',
                        family === 'accessory' ? 'items-start gap-9 px-9 py-7' : 'items-start',
                    )}
                >
                    {variants.map((variant) => (
                        <div
                            className="flex flex-col items-center"
                            key={`${variant.name}-${variant.meta}`}
                        >
                            {variant.render()}
                            <p className="m-0 mt-2.5 text-center text-[12px] font-semibold text-fg">
                                {variant.name}
                            </p>
                            <p className="m-0 text-center font-mono text-[10px] text-dim">
                                {variant.meta}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
