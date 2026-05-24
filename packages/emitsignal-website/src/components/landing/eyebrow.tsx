import type { ReactNode } from 'react';

interface EyebrowProps {
    children: ReactNode;
}

export function Eyebrow({ children }: EyebrowProps) {
    return (
        <div className="mb-3.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[2px] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
            {children}
        </div>
    );
}
