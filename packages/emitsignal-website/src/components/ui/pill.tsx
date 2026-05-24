import type { ReactNode } from 'react';

import { cn } from '#/lib/cn';

interface PillProps {
    children: ReactNode;
    mono?: boolean;
    solid?: boolean;
    tone?: Tone;
}

type Tone = 'accent' | 'danger' | 'success' | 'warn';

const TONE_RING: Record<Tone, string> = {
    accent: 'text-accent border-accent/40',
    danger: 'text-danger border-danger/40',
    success: 'text-success border-success/40',
    warn: 'text-warn border-warn/40',
};

const TONE_SOLID: Record<Tone, string> = {
    accent: 'bg-accent text-bg',
    danger: 'bg-danger text-bg',
    success: 'bg-success text-bg',
    warn: 'bg-warn text-bg',
};

export function Pill({ children, mono = true, solid = false, tone = 'accent' }: PillProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-[3px] text-[10.5px] font-semibold tracking-[0.4px]',
                mono ? 'font-mono' : 'font-sans',
                solid ? TONE_SOLID[tone] : `border ${TONE_RING[tone]}`,
            )}
        >
            {children}
        </span>
    );
}
