interface AvatarProps {
    monogram?: string;
    name: string;
    rounded?: number;
    size?: number;
}

export function Avatar({ monogram, name, rounded = 8, size = 36 }: AvatarProps) {
    const hue = hashHue(name);
    const computedMonogram =
        monogram ??
        name
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
            {computedMonogram}
        </div>
    );
}

function hashHue(name: string): number {
    let hash = 0;

    for (let index = 0; index < name.length; index++) {
        hash = (hash * 31 + name.charCodeAt(index)) & 0xfffff;
    }

    return hash % 360;
}
