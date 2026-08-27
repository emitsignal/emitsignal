import { Monitor, Moon, Sun } from 'lucide-react';

import type { ThemePreference } from '#/lib/theme';

import { useTheme } from '#/ctx/theme';
import { cn } from '#/lib/cn';

const OPTIONS: { icon: typeof Sun; label: string; value: ThemePreference }[] = [
    { icon: Monitor, label: 'System theme', value: 'system' },
    { icon: Sun, label: 'Light theme', value: 'light' },
    { icon: Moon, label: 'Dark theme', value: 'dark' },
];

/** `rail` stacks the options vertically at `md` and up, for the collapsed sidebar. */
export function ThemeToggle({ rail = false }: { rail?: boolean }) {
    const { setTheme, theme } = useTheme();

    return (
        <div
            className={cn(
                'flex items-center gap-0.5 rounded-md border border-line bg-elev/40 p-0.5',
                rail && 'md:flex-col',
            )}
        >
            {OPTIONS.map(({ icon: Icon, label, value }) => {
                const active = theme === value;

                return (
                    <button
                        aria-label={label}
                        aria-pressed={active}
                        className={cn(
                            'flex h-6 flex-1 cursor-pointer items-center justify-center rounded',
                            rail && 'md:w-full md:flex-none',
                            active ? 'bg-accent/15 text-accent' : 'text-dim hover:text-fg',
                        )}
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
