import type { CSSProperties, ReactNode } from 'react';

import { cn } from '#/lib/cn';

interface SettingsCardProps {
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    description?: string;
    style?: CSSProperties;
    title?: string;
}

export function SettingsCard({
    action,
    children,
    className,
    description,
    style,
    title,
}: SettingsCardProps) {
    const hasHeader = title !== undefined || action !== undefined;

    return (
        <div
            className={cn(
                'mb-[18px] rounded-[10px] border border-line bg-elev px-6 py-[22px]',
                className,
            )}
            style={style}
        >
            {hasHeader ? (
                <div className="mb-[18px] flex items-start gap-3.5">
                    <div className="min-w-0 flex-1">
                        {title !== undefined ? (
                            <div className="text-[16px] font-semibold tracking-[-0.2px] text-fg">
                                {title}
                            </div>
                        ) : null}
                        {description !== undefined ? (
                            <div className="mt-1 text-[12.5px] leading-relaxed text-muted">
                                {description}
                            </div>
                        ) : null}
                    </div>
                    {action}
                </div>
            ) : null}
            {children}
        </div>
    );
}
