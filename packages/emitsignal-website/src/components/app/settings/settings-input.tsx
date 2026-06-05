interface SettingsInputProps {
    monospace?: boolean;
    placeholder?: string;
    suffix?: string;
    value?: string;
}

export function SettingsInput({
    monospace = false,
    placeholder,
    suffix,
    value,
}: SettingsInputProps) {
    return (
        <div className="flex h-[38px] items-center rounded-[7px] border border-line bg-elev px-3">
            <span
                className={`flex-1 truncate text-[13.5px] ${monospace ? 'font-mono' : ''} ${value !== undefined ? 'text-fg' : 'text-dim'}`}
            >
                {value !== undefined ? value : placeholder}
            </span>
            {suffix !== undefined ? (
                <span className="ml-2 font-mono text-[11px] text-dim">{suffix}</span>
            ) : null}
        </div>
    );
}
