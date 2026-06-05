import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SettingsButtonProps {
    children: ReactNode;
    icon?: LucideIcon;
    onClick?: () => void;
    size?: 'md' | 'sm';
    variant?: 'danger' | 'ghost' | 'primary';
}

const VARIANT_CLASS = {
    danger: 'border border-danger/40 bg-transparent text-danger hover:bg-danger/5',
    ghost: 'border border-line bg-transparent text-fg hover:bg-elev-2',
    primary: 'border-0 bg-accent text-bg hover:bg-accent-dim',
} as const;

const SIZE_CLASS = {
    md: 'gap-2 px-3.5 py-2 text-[13px]',
    sm: 'gap-1.5 px-2.5 py-[5px] text-[12px]',
} as const;

export function SettingsButton({
    children,
    icon: Icon,
    onClick,
    size = 'md',
    variant = 'ghost',
}: SettingsButtonProps) {
    return (
        <button
            className={`inline-flex shrink-0 cursor-pointer items-center rounded-[7px] font-semibold transition-colors ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]}`}
            onClick={onClick}
            type="button"
        >
            {Icon !== undefined ? <Icon size={12} /> : null}
            {children}
        </button>
    );
}
