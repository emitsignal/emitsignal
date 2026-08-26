interface WebhookSettingsTabProps {
    name: string;
    onNameChange: (name: string) => void;
    placeholder: string;
}

export function WebhookSettingsTab({ name, onNameChange, placeholder }: WebhookSettingsTabProps) {
    return (
        <div className="px-5 py-4">
            <div className="mb-1 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[1px] text-dim">
                Name
                <span className="normal-case tracking-normal text-faint">
                    optional · how it is listed
                </span>
            </div>

            <input
                className="w-full rounded-lg border border-line bg-elev px-3 py-2 font-mono text-[12.5px] text-fg outline-none placeholder:text-faint focus:border-accent/50"
                onChange={(event) => onNameChange(event.target.value)}
                placeholder={placeholder}
                value={name}
            />
        </div>
    );
}
