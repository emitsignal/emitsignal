import { withAlpha } from '#/lib/color';

interface UsageBarProps {
    color?: string;
    total: number;
    unit?: string;
    used: number;
}

export function UsageBar({ color = 'var(--color-accent)', total, unit = '', used }: UsageBarProps) {
    // A zero (or negative) total means the plan grants no allowance, so guard
    // against dividing by zero: full if anything is used, otherwise empty.
    const percentage =
        total <= 0 ? (used > 0 ? 100 : 0) : Math.min(100, Math.round((used / total) * 100));
    const isOverThreshold = percentage >= 90;
    const barColor = isOverThreshold ? 'var(--color-warn)' : color;

    return (
        <div>
            <div className="mb-[7px] flex items-baseline justify-between">
                <span className="font-mono text-[12.5px] text-fg">
                    {used.toLocaleString('en-US')}
                    <span className="text-dim">
                        {' '}
                        / {total.toLocaleString('en-US')}
                        {unit}
                    </span>
                </span>
                <span className="font-mono text-[11px]" style={{ color: barColor }}>
                    {percentage}%
                </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-chip">
                <div
                    className="h-full rounded-full"
                    style={{
                        background: barColor,
                        boxShadow: `0 0 8px ${withAlpha(barColor, 40)}`,
                        width: `${percentage}%`,
                    }}
                />
            </div>
        </div>
    );
}
