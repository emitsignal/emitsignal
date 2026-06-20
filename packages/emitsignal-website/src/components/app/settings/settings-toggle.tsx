import { useState } from 'react';

interface SettingsToggleProps {
    checked?: boolean;
    danger?: boolean;
    defaultOn?: boolean;
    description?: string;
    label: string;
    onChange?: (next: boolean) => void;
}

export function SettingsToggle({
    checked,
    danger = false,
    defaultOn = false,
    description,
    label,
    onChange,
}: SettingsToggleProps) {
    const [internalOn, setInternalOn] = useState(defaultOn);
    const isControlled = checked !== undefined;
    const on = isControlled ? checked : internalOn;

    const handleClick = () => {
        const next = !on;

        if (isControlled) {
            onChange?.(next);
        } else {
            setInternalOn(next);
            onChange?.(next);
        }
    };

    return (
        <div className="flex items-start gap-3.5 border-b border-line py-3.5 last:border-b-0">
            <div className="min-w-0 flex-1">
                <div className={`text-[13.5px] font-medium ${danger ? 'text-danger' : 'text-fg'}`}>
                    {label}
                </div>
                {description !== undefined ? (
                    <div className="mt-1 text-[12px] leading-relaxed text-muted">{description}</div>
                ) : null}
            </div>

            <button className="mt-0.5 shrink-0 cursor-pointer" onClick={handleClick} type="button">
                <div
                    className={`flex h-5 w-9 items-center rounded-full border px-0.5 transition-all ${
                        on
                            ? 'justify-end border-accent bg-accent'
                            : 'justify-start border-line bg-chip'
                    }`}
                >
                    <div className={`h-3.5 w-3.5 rounded-full ${on ? 'bg-bg' : 'bg-dim'}`} />
                </div>
            </button>
        </div>
    );
}
