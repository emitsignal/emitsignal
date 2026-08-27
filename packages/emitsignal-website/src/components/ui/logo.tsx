import { cn } from '#/lib/cn';

interface LogoProps {
    className?: string;
    label?: string;
    labelClassName?: string;
    pulse?: boolean;
    size?: number;
}

export function Logo({
    className,
    label = 'EmitSignal',
    labelClassName,
    pulse = false,
    size = 14,
}: LogoProps) {
    return (
        <span
            className={cn('inline-flex items-center font-mono font-medium text-fg', className)}
            style={{ fontSize: size, gap: size * 0.55, letterSpacing: -0.3 }}
        >
            <span
                className={cn(
                    'inline-block rounded-full bg-accent',
                    pulse && 'animate-[signal-pulse_2s_ease-in-out_infinite]',
                )}
                style={{
                    boxShadow: pulse ? `0 0 ${size * 0.6}px var(--color-accent)` : undefined,
                    height: size * 0.55,
                    width: size * 0.55,
                }}
            />
            <span className={labelClassName}>{label}</span>
        </span>
    );
}
