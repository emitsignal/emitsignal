export type WebhookTab = 'settings' | 'signature' | 'template';

interface WebhookTabBarProps {
    active: WebhookTab;
    onChange: (tab: WebhookTab) => void;
}

const TABS: { id: WebhookTab; label: string }[] = [
    { id: 'template', label: 'Template' },
    { id: 'settings', label: 'Settings' },
    { id: 'signature', label: 'Signature' },
];

export function WebhookTabBar({ active, onChange }: WebhookTabBarProps) {
    return (
        <div className="flex gap-4 border-b border-line px-5" role="tablist">
            {TABS.map((tab) => {
                const isActive = tab.id === active;

                return (
                    <button
                        aria-selected={isActive}
                        className="flex cursor-pointer items-center gap-1.5 border-b-2 py-3 font-mono text-[11px] uppercase tracking-[1.2px] transition-colors"
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        role="tab"
                        style={{
                            borderBottomColor: isActive ? 'var(--color-accent)' : 'transparent',
                            color: isActive ? 'var(--color-accent)' : 'var(--color-dim)',
                        }}
                        type="button"
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
