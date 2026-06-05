import type { ReactNode } from 'react';

import { cn } from '#/lib/cn';

interface SettingsGroupProps {
    children: ReactNode;
    className?: string;
}

interface SettingsRowProps {
    children: ReactNode;
    last?: boolean;
}

export function SettingsGroup({ children, className }: SettingsGroupProps) {
    return (
        <div className={cn('overflow-hidden rounded-lg border border-line', className)}>
            {children}
        </div>
    );
}

export function SettingsRow({ children, last = false }: SettingsRowProps) {
    return (
        <div
            className={`flex items-center gap-3.5 px-4 py-3.5 ${last ? '' : 'border-b border-line'}`}
        >
            {children}
        </div>
    );
}
