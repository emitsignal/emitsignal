import type { ReactNode } from 'react';

import { cn } from '#/lib/cn';

interface CodeProps {
    children: ReactNode;
    className?: string;
    language?: string;
}

export function Code({ children, className, language }: CodeProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-lg border border-line bg-deep px-3 py-2.5 font-mono text-[11.5px] leading-[1.55] text-muted',
                className,
            )}
        >
            {language && (
                <div className="mb-1.5 text-[9.5px] uppercase tracking-[1.2px] text-dim">
                    {language}
                </div>
            )}
            <pre className="m-0 whitespace-pre-wrap break-words font-mono text-fg">{children}</pre>
        </div>
    );
}
