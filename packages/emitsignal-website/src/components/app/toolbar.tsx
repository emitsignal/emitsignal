import type { ReactNode } from 'react';

import { cn } from '#/lib/cn';

interface ToolbarProps {
    actions?: ReactNode;
    className?: string;
    subtitle?: ReactNode;
    title: ReactNode;
}

export function Toolbar({ actions, className, subtitle, title }: ToolbarProps) {
    return (
        <div
            className={cn(
                'flex h-12 shrink-0 items-center gap-3 border-b border-line px-4.5',
                className,
            )}
        >
            <span className="text-[14px] font-semibold">{title}</span>
            {subtitle && <span className="font-mono text-[11px] text-dim">{subtitle}</span>}
            <div className="flex-1" />
            {actions}
        </div>
    );
}
