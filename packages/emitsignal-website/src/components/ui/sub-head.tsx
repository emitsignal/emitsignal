import type { ReactNode } from 'react';

import { cn } from '#/lib/cn';

interface SubHeadProps {
    children: ReactNode;
    className?: string;
}

export function SubHead({ children, className }: SubHeadProps) {
    return (
        <div
            className={cn(
                'mb-2 font-mono text-[10px] font-medium uppercase tracking-[1.5px] text-dim',
                className,
            )}
        >
            {children}
        </div>
    );
}
