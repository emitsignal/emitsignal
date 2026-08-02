import type { ReactNode } from 'react';

interface EyebrowProps {
    children: ReactNode;
}

export function Eyebrow({ children }: EyebrowProps) {
    return (
        <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[2px] text-accent">
            {children}
        </div>
    );
}
