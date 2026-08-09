import type { ReactNode } from 'react';

import { cn } from '#/lib/cn';

interface SectionProps {
    children: ReactNode;
    className?: string;
    divider?: boolean;
    id?: string;
}

export function Section({ children, className, divider = true, id }: SectionProps) {
    return (
        <section className={cn('relative px-6 py-24 md:px-12 md:py-36', className)} id={id}>
            {divider && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent md:inset-x-12"
                />
            )}

            <div className="mx-auto max-w-[1200px]">{children}</div>
        </section>
    );
}
