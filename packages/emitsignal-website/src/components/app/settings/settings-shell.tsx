import type { ReactNode } from 'react';

import { Link } from '@tanstack/react-router';

interface SubNavItem {
    group: 'DANGER' | 'TEAM' | 'YOU';
    key: string;
    label: string;
    path?: string;
}

const NAV_ITEMS: SubNavItem[] = [
    { group: 'YOU', key: 'profile', label: 'Profile', path: '/app/settings/profile' },
    { group: 'YOU', key: 'account', label: 'Account', path: '/app/settings/account' },
    { group: 'YOU', key: 'notifications', label: 'Notifications' },
    { group: 'YOU', key: 'delivery', label: 'Delivery targets' },
    { group: 'YOU', key: 'security', label: 'Security' },
    { group: 'TEAM', key: 'workspace', label: 'Workspace' },
    { group: 'TEAM', key: 'members', label: 'Members' },
    { group: 'TEAM', key: 'billing', label: 'Billing & plan', path: '/app/settings/billing' },
    { group: 'TEAM', key: 'audit', label: 'Audit log' },
    { group: 'DANGER', key: 'advanced', label: 'Advanced', path: '/app/settings/advanced' },
];

const GROUPS = ['YOU', 'TEAM', 'DANGER'] as const;

interface SettingsShellProps {
    children: ReactNode;
}

export function SettingsShell({ children }: SettingsShellProps) {
    return (
        <div className="flex min-h-0 flex-1 overflow-hidden">
            <nav className="w-[220px] shrink-0 overflow-auto border-r border-line px-3.5 py-5">
                {GROUPS.map((group) => (
                    <div className="mb-3.5" key={group}>
                        <div className="mb-1.5 px-2.5 font-mono text-[9.5px] tracking-[1.6px] text-dim">
                            {group}
                        </div>
                        {NAV_ITEMS.filter((item) => item.group === group).map((item) =>
                            item.path !== undefined ? (
                                <Link
                                    activeProps={{
                                        className:
                                            'mb-0.5 block rounded-md border-l-2 border-accent bg-accent/10 px-2.5 py-1.5 text-[13px] font-medium text-accent no-underline',
                                    }}
                                    className="mb-0.5 block rounded-md border-l-2 border-transparent px-2.5 py-1.5 text-[13px] text-muted no-underline hover:text-fg"
                                    key={item.key}
                                    to={item.path as never}
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <div
                                    className="mb-0.5 cursor-default rounded-md border-l-2 border-transparent px-2.5 py-1.5 text-[13px] text-faint"
                                    key={item.key}
                                >
                                    {item.label}
                                </div>
                            ),
                        )}
                    </div>
                ))}
            </nav>

            <div className="min-w-0 flex-1 overflow-auto px-8 pb-16 pt-6">{children}</div>
        </div>
    );
}
