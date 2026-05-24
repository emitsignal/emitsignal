import { Link } from '@tanstack/react-router';
import { Bell, Key, LayoutGrid, type LucideIcon, Settings, Terminal } from 'lucide-react';

import { Avatar } from '#/components/ui/avatar';
import { Dot } from '#/components/ui/dot';
import { Logo } from '#/components/ui/logo';
import { SAMPLE_CHANNELS } from '#/lib/data';

interface NavItem {
    badge?: number;
    exact?: boolean;
    icon: LucideIcon;
    label: string;
    to: string;
}

const NAV: NavItem[] = [
    { badge: 7, exact: true, icon: Bell, label: 'Inbox', to: '/app' },
    { badge: 8, icon: LayoutGrid, label: 'Channels', to: '/app/channels' },
    { icon: Terminal, label: 'Publish', to: '/app/publish' },
    { icon: Key, label: 'API Keys', to: '/app/keys' },
];

const INACTIVE =
    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-normal text-muted no-underline hover:bg-elev/60';
const ACTIVE =
    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-accent no-underline bg-accent/10';

export function Sidebar() {
    return (
        <aside className="flex w-[210px] shrink-0 flex-col gap-0.5 border-r border-line p-2.5 pt-4">
            <div className="px-2.5 pb-3.5 pt-1">
                <Logo pulse size={13} />
            </div>

            {NAV.map((item) => (
                <SidebarLink item={item} key={item.to} />
            ))}

            <SidebarStatic icon={Settings} label="Settings" />

            <p className="mt-4.5 px-2.5 pb-1.5 font-mono text-[9.5px] tracking-[1.5px] text-dim">
                CHANNELS
            </p>
            {SAMPLE_CHANNELS.slice(0, 6).map((channel) => (
                <div
                    className="flex items-center gap-2 px-2.5 py-1 font-mono text-[11.5px] text-muted"
                    key={channel.id}
                >
                    <Dot level={channel.prio} size={5} />
                    <span className="flex-1 truncate">{channel.name}</span>
                    {channel.unread > 0 && <span className="text-accent">{channel.unread}</span>}
                </div>
            ))}

            <SidebarUser />
        </aside>
    );
}

function SidebarLink({ item }: { item: NavItem }) {
    const Icon = item.icon;
    return (
        <Link
            activeOptions={item.exact ? { exact: true } : undefined}
            activeProps={{ className: ACTIVE }}
            className={INACTIVE}
            to={item.to as never}
        >
            {({ isActive }) => (
                <>
                    <Icon size={14} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                        <span
                            className={`font-mono text-[10px] ${isActive ? 'text-accent' : 'text-dim'}`}
                        >
                            {item.badge}
                        </span>
                    )}
                </>
            )}
        </Link>
    );
}

function SidebarStatic({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
    return (
        <div className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted">
            <Icon size={14} />
            <span className="flex-1">{label}</span>
        </div>
    );
}

function SidebarUser() {
    return (
        <div className="mt-auto flex items-center gap-2 border-t border-line p-2.5">
            <Avatar name="alex" rounded={100} size={22} />
            <span className="text-[12px]">alex@emitsignal</span>
        </div>
    );
}
