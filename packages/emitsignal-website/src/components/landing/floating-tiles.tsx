import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

import { Bell, Mail, Radio, Smartphone, TerminalSquare, Webhook } from 'lucide-react';

interface Tile {
    delay: number;
    icon: LucideIcon;
    left: string;
    rotate: number;
    size: number;
    top: string;
}

const TILES: Tile[] = [
    { delay: 0, icon: Bell, left: '5%', rotate: -12, size: 96, top: '16%' },
    { delay: 1.4, icon: Mail, left: '2%', rotate: 8, size: 76, top: '54%' },
    { delay: 2.6, icon: TerminalSquare, left: '10%', rotate: -6, size: 68, top: '78%' },
    { delay: 0.8, icon: Smartphone, left: '85%', rotate: 11, size: 92, top: '14%' },
    { delay: 2.1, icon: Webhook, left: '91%', rotate: -9, size: 78, top: '52%' },
    { delay: 3.2, icon: Radio, left: '80%', rotate: 6, size: 64, top: '77%' },
];

export function FloatingTiles() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
            {TILES.map((tile, index) => {
                const Icon = tile.icon;

                return (
                    <div
                        className="absolute flex items-center justify-center rounded-[22px] border border-line bg-elev shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)]"
                        key={index}
                        style={tileStyle(tile, index)}
                    >
                        <Icon className="text-dim" size={tile.size * 0.34} strokeWidth={1.5} />
                    </div>
                );
            })}
        </div>
    );
}

function tileStyle({ delay, left, rotate, size, top }: Tile, index: number): CSSProperties {
    return {
        '--tile-rotate': `${rotate}deg`,
        animation: `signal-float ${7 + (index % 3)}s ease-in-out ${delay}s infinite`,
        height: size,
        left,
        top,
        transform: `rotate(${rotate}deg)`,
        width: size,
    } as CSSProperties;
}
