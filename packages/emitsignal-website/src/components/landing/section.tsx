import type { CSSProperties, ReactNode } from 'react';

import { cn } from '#/lib/cn';

interface SectionProps {
    children: ReactNode;
    className?: string;
    id?: string;
    style?: CSSProperties;
}

export function Section({ children, className, id, style }: SectionProps) {
    return (
        <section
            className={cn('border-t border-line px-16 py-24', className)}
            id={id}
            style={style}
        >
            <div className="mx-auto max-w-[1280px]">{children}</div>
        </section>
    );
}
