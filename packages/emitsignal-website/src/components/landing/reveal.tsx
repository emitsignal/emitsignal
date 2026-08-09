import type { ReactNode } from 'react';

import { useInView } from '#/hooks/use-in-view';
import { cn } from '#/lib/cn';

interface RevealProps {
    children: ReactNode;
    className?: string;
    delayMs?: number;
}

export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
    const { inView, ready, ref } = useInView();
    const hidden = ready && !inView;

    return (
        <div
            className={cn(
                'transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
                hidden ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100',
                className,
            )}
            ref={ref}
            style={{ transitionDelay: `${delayMs}ms` }}
        >
            {children}
        </div>
    );
}
