import { Link, useNavigate } from '@tanstack/react-router';
import {
    Bell,
    Key,
    LayoutGrid,
    LogOut,
    type LucideIcon,
    Plus,
    Settings,
    Terminal,
    Webhook,
} from 'lucide-react';
import { useState } from 'react';

import { Avatar } from '#/components/ui/avatar';
import { Dot } from '#/components/ui/dot';
import { Logo } from '#/components/ui/logo';
import { useSession } from '#/ctx/session';
import { useSubscriptions } from '#/ctx/subscriptions';
import { hashTopicLevel } from '#/lib/priority';

interface NavItem {
    badge?: number;
    exact?: boolean;
    icon: LucideIcon;
    label: string;
    to: string;
}

const INACTIVE =
    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-normal text-muted no-underline hover:bg-elev/60';
const ACTIVE =
    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-accent no-underline bg-accent/10';

export function Sidebar() {
    const { signOut, user } = useSession();
    const { subscribe, subscriptions } = useSubscriptions();
    const navigate = useNavigate();

    const [adding, setAdding] = useState(false);
    const [newTopic, setNewTopic] = useState('');
    const [subscribing, setSubscribing] = useState(false);

    const channelCount = subscriptions.length;

    const NAV: NavItem[] = [
        { exact: true, icon: Bell, label: 'Inbox', to: '/app/inbox' },
        { badge: channelCount, icon: LayoutGrid, label: 'Channels', to: '/app/channels' },
        { icon: Terminal, label: 'Publish', to: '/app/publish' },
        { icon: Webhook, label: 'Webhooks', to: '/app/webhooks' },
        { icon: Key, label: 'API Keys', to: '/app/keys' },
        { icon: Settings, label: 'Settings', to: '/app/settings' },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate({ to: '/' });
    };

    const handleSubscribe = async () => {
        const trimmed = newTopic.trim();

        if (!trimmed) {
            return;
        }

        setSubscribing(true);

        try {
            await subscribe(trimmed);

            setNewTopic('');
            setAdding(false);
            navigate({ search: { topic: trimmed }, to: '/app/channels' });
        } catch {
            // ignore
        } finally {
            setSubscribing(false);
        }
    };

    return (
        <aside className="flex w-[210px] shrink-0 flex-col gap-0.5 border-r border-line p-2.5 pt-4">
            <div className="px-2.5 pb-3.5 pt-1">
                <Logo pulse size={13} />
            </div>

            {NAV.map((item) => (
                <SidebarLink item={item} key={item.to} />
            ))}

            <div className="mt-4.5 flex items-center px-2.5 pb-1.5">
                <p className="font-mono text-[9.5px] tracking-[1.5px] text-dim">CHANNELS</p>
                {adding ? (
                    <div className="ml-auto flex items-center gap-1">
                        <input
                            autoFocus
                            className="w-[90px] rounded border border-line bg-elev px-1.5 py-0.5 font-mono text-[10px] text-fg outline-none placeholder:text-dim"
                            onChange={(event) => setNewTopic(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') handleSubscribe();
                                if (event.key === 'Escape') setAdding(false);
                            }}
                            placeholder="topic/name"
                            value={newTopic}
                        />
                        <button
                            className="font-mono text-[10px] text-accent hover:text-fg disabled:opacity-50"
                            disabled={!newTopic.trim() || subscribing}
                            onClick={handleSubscribe}
                        >
                            {subscribing ? '…' : 'ok'}
                        </button>
                    </div>
                ) : (
                    <button
                        className="ml-auto flex h-4 w-4 items-center justify-center rounded text-dim hover:text-fg"
                        onClick={() => setAdding(true)}
                    >
                        <Plus size={12} />
                    </button>
                )}
            </div>

            {subscriptions.length === 0 && (
                <p className="px-2.5 py-1 font-mono text-[10px] text-dim">no subscriptions yet</p>
            )}

            {subscriptions.slice(0, 6).map((subscription) => (
                <Link
                    className="flex items-center gap-2 rounded-md px-2.5 py-1 font-mono text-[11.5px] text-muted no-underline hover:bg-elev/60"
                    key={subscription.id}
                    search={{ topic: subscription.topic.name }}
                    to="/app/channels"
                >
                    <Dot level={hashTopicLevel(subscription.topic.name)} size={5} />

                    <span className="flex-1 truncate">{subscription.topic.name}</span>
                </Link>
            ))}

            <div className="mt-auto">
                {user && (
                    <div className="flex items-center gap-2 border-t border-line p-2.5">
                        <Avatar
                            name={user.name || user.email}
                            rounded={100}
                            size={22}
                            src={user.image}
                        />

                        <span className="flex-1 truncate text-[12px]">{user.email}</span>

                        <button
                            className="cursor-pointer rounded p-1 text-dim hover:bg-elev hover:text-fg"
                            onClick={handleSignOut}
                            title="Sign out"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                )}
            </div>
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

                    {item.badge !== undefined && item.badge > 0 && (
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
