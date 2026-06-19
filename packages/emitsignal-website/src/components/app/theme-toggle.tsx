import { Monitor, Moon, Sun } from 'lucide-react';

import type { ThemePreference } from '#/lib/theme';

import { useTheme } from '#/ctx/theme';

const OPTIONS: { icon: typeof Sun; label: string; value: ThemePreference }[] = [
    { icon: Monitor, label: 'System theme', value: 'system' },
    { icon: Sun, label: 'Light theme', value: 'light' },
    { icon: Moon, label: 'Dark theme', value: 'dark' },
];

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    return (
        <div className="flex items-center gap-0.5 rounded-md border border-line bg-elev/40 p-0.5">
            {OPTIONS.map(({ icon: Icon, label, value }) => {
                const active = theme === value;

                return (
                    <button
                        aria-label={label}
                        aria-pressed={active}
                        className={`flex h-6 flex-1 cursor-pointer items-center justify-center rounded ${
                            active ? 'bg-accent/15 text-accent' : 'text-dim hover:text-fg'
                        }`}
                        key={value}
                        onClick={() => setTheme(value)}
                        title={label}
                        type="button"
                    >
                        <Icon size={13} />
                    </button>
                );
            })}
        </div>
    );
}
