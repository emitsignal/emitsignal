import { priorityHex } from '#/lib/priority';

interface DotProps {
    glow?: boolean;
    level?: number;
    size?: number;
}

export function Dot({ glow = true, level = 3, size = 6 }: DotProps) {
    const color = priorityHex(level);
    return (
        <span
            className="inline-block shrink-0 rounded-full"
            style={{
                background: color,
                boxShadow: glow ? `0 0 ${size}px ${color}99` : undefined,
                height: size,
                width: size,
            }}
        />
    );
}
