import type { ReactNode } from 'react';

interface SettingsFieldProps {
    children: ReactNode;
    hint?: string;
    label: string;
}

export function SettingsField({ children, hint, label }: SettingsFieldProps) {
    return (
        <div>
            <div className="mb-1 text-[13px] font-medium text-fg">{label}</div>
            {hint !== undefined ? (
                <div className="mb-2.5 font-mono text-[11px] leading-relaxed text-dim">{hint}</div>
            ) : null}
            {children}
        </div>
    );
}
