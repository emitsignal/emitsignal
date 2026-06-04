import { priorityHex } from '#/lib/priority';
interface DotProps {
    className?: string;
    glow?: boolean;
    level?: number;
    size?: number;
}

export function Dot({ className = '', glow = true, level = 3, size = 6 }: DotProps) {
    const color = priorityHex(level);

    return (
        <span
            className={`inline-block shrink-0 rounded-full ${className}`}
            style={{
                background: color,
                boxShadow: glow ? `0 0 ${size}px ${color}99` : undefined,
                height: size,
                width: size,
            }}
        />
    );
}
