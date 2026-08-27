import type { ReactNode } from 'react';

import { Menu } from 'lucide-react';

import { useSidebar } from '#/ctx/sidebar';
import { cn } from '#/lib/cn';

interface ToolbarProps {
    actions?: ReactNode;
    className?: string;
    subtitle?: ReactNode;
    title: ReactNode;
}

export function Toolbar({ actions, className, subtitle, title }: ToolbarProps) {
    const { setMobileOpen } = useSidebar();

    return (
        <div
            className={cn(
                'flex h-12 shrink-0 items-center gap-2 border-b border-line px-4.5 sm:gap-3',
                className,
            )}
        >
            <button
                aria-label="Open navigation"
                className="-ml-1.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded text-dim hover:bg-elev hover:text-fg md:hidden"
                onClick={() => setMobileOpen(true)}
                type="button"
            >
                <Menu size={16} />
            </button>

            <span className="min-w-0 truncate text-[14px] font-semibold">{title}</span>
            {subtitle && (
                <span className="hidden shrink-0 font-mono text-[11px] text-dim sm:inline">
                    {subtitle}
                </span>
            )}
            <div className="flex-1" />
            {actions}
        </div>
    );
}
