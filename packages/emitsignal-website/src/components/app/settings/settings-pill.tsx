import type { ReactNode } from 'react';

type SettingsPillTone = 'accent-solid' | 'dim' | 'success' | 'warn';

interface SettingsPillProps {
    children: ReactNode;
    tone: SettingsPillTone;
}

const TONE_CLASS: Record<SettingsPillTone, string> = {
    'accent-solid': 'bg-accent text-bg',
    dim: 'border border-dim/40 text-dim',
    success: 'border border-success/40 text-success',
    warn: 'border border-warn/40 text-warn',
};

export function SettingsPill({ children, tone }: SettingsPillProps) {
    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-full px-2 py-[3px] font-mono text-[10.5px] font-semibold tracking-[0.4px] ${TONE_CLASS[tone]}`}
        >
            {children}
        </span>
    );
}
