import type { PlanName } from '@emitsignal/shared/billing';

import { PLANS } from '@emitsignal/shared/billing';
import { TOPIC_NAME_MAX_LENGTH } from '@emitsignal/shared/topic';
import { Link, useNavigate } from '@tanstack/react-router';
import {
    Bell,
    Crown,
    Key,
    LayoutGrid,
    LogOut,
    type LucideIcon,
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
    Settings,
    Terminal,
    Webhook,
} from 'lucide-react';
import { useState } from 'react';

import type { Topic } from '#/lib/api';

import { AccessModeIcon } from '#/components/app/channels/access-mode';
import { ThemeToggle } from '#/components/app/theme-toggle';
import { Avatar } from '#/components/ui/avatar';
import { Dot } from '#/components/ui/dot';
import { Logo } from '#/components/ui/logo';
import { useSession } from '#/ctx/session';
import { useSidebar } from '#/ctx/sidebar';
import { useSubscriptions } from '#/ctx/subscriptions';
import { useToast } from '#/ctx/toast';
import { useBilling } from '#/hooks/use-billing';
import { useChannels } from '#/hooks/use-channels';
import { apiErrorMessage } from '#/lib/api-error';
import { cn } from '#/lib/cn';
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
    const { billing } = useBilling();
    const { signOut, user } = useSession();
    const { collapsed, mobileOpen, setMobileOpen, toggleCollapsed } = useSidebar();
    const { owned, subscriptions } = useChannels();
    const { subscribe } = useSubscriptions();
    const navigate = useNavigate();
    const toast = useToast();

    const plan = billing?.plan;

    const [adding, setAdding] = useState(false);
    const [newTopic, setNewTopic] = useState('');
    const [subscribing, setSubscribing] = useState(false);

    const channelCount = subscriptions.length + owned.length;

    // The drawer always renders at full width, so `collapsed` may only ever
    // hide things from `md` up — never on mobile.
    const railHidden = collapsed ? 'md:hidden' : '';

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
            navigate({
                search: { priority: undefined, tags: [], topic: trimmed },
                to: '/app/channels',
            });
        } catch (error) {
            toast(apiErrorMessage(error, 'Could not subscribe to this topic'), 'danger');
        } finally {
            setSubscribing(false);
        }
    };

    return (
        <>
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                    style={{ backdropFilter: 'blur(3px)', background: 'var(--color-scrim)' }}
                />
            )}

            <aside
                aria-label="Primary"
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-[250px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-line bg-bg p-2.5 pt-4 transition-transform duration-200',
                    'md:static md:z-auto md:translate-x-0 md:transition-[width]',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                    collapsed && 'md:w-[56px] md:px-1.5',
                )}
            >
                <div
                    className={cn(
                        'flex items-center gap-2 px-2.5 pb-3.5 pt-1',
                        collapsed && 'md:flex-col md:gap-2.5 md:px-0',
                    )}
                >
                    <Logo labelClassName={railHidden} pulse size={13} />

                    <button
                        aria-expanded={!collapsed}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className={cn(
                            'ml-auto hidden h-6 w-6 cursor-pointer items-center justify-center rounded text-dim hover:bg-elev hover:text-fg md:flex',
                            collapsed && 'md:ml-0',
                        )}
                        onClick={toggleCollapsed}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        type="button"
                    >
                        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
                    </button>
                </div>

                {NAV.map((item) => (
                    <SidebarLink collapsed={collapsed} item={item} key={item.to} />
                ))}

                <div className={cn('mt-4.5 flex items-center px-2.5 pb-1.5', railHidden)}>
                    <p className="font-mono text-[9.5px] tracking-[1.5px] text-dim">CHANNELS</p>
                    {adding ? (
                        <div className="ml-auto flex items-center gap-1">
                            <input
                                autoFocus
                                className="w-[90px] rounded border border-line bg-elev px-1.5 py-0.5 font-mono text-[10px] text-fg outline-none placeholder:text-dim"
                                maxLength={TOPIC_NAME_MAX_LENGTH}
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
                            aria-label="Subscribe to a channel"
                            className="ml-auto flex h-4 w-4 items-center justify-center rounded text-dim hover:text-fg"
                            onClick={() => setAdding(true)}
                            title="Subscribe to a channel"
                        >
                            <Plus size={12} />
                        </button>
                    )}
                </div>

                {channelCount === 0 && (
                    <p className={cn('px-2.5 py-1 font-mono text-[10px] text-dim', railHidden)}>
                        no subscriptions yet
                    </p>
                )}

                {subscriptions.slice(0, 6).map((subscription) => (
                    <ChannelLink
                        key={subscription.id}
                        railHidden={railHidden}
                        topic={subscription.topic}
                    />
                ))}

                {owned.length > 0 && (
                    <p
                        className={cn(
                            'mt-3 px-2.5 pb-1.5 pt-1 font-mono text-[9.5px] tracking-[1.5px] text-dim',
                            railHidden,
                        )}
                    >
                        NOT SUBSCRIBED
                    </p>
                )}

                {owned.slice(0, 6).map((topic) => (
                    <ChannelLink key={topic.id} railHidden={railHidden} topic={topic} />
                ))}

                <div className="mt-auto">
                    <div className={cn('px-2.5 pb-2 pt-2.5', collapsed && 'md:px-0')}>
                        <ThemeToggle rail={collapsed} />
                    </div>

                    {user && (
                        <div
                            className={cn(
                                'flex items-center gap-2.5 border-t border-line p-2.5',
                                collapsed && 'md:flex-col md:gap-2 md:px-0',
                            )}
                        >
                            <Avatar
                                name={user.name || user.email}
                                rounded={100}
                                size={30}
                                src={user.image}
                            />

                            <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', railHidden)}>
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate text-[12.5px] font-medium text-fg">
                                        {user.name || user.email.split('@')[0]}
                                    </span>

                                    {plan && <PlanPill plan={plan} />}
                                </div>

                                <span className="truncate text-[11px] text-dim">{user.email}</span>
                            </div>

                            <button
                                aria-label="Sign out"
                                className={cn(
                                    'cursor-pointer self-start rounded p-1 text-dim hover:bg-elev hover:text-fg',
                                    collapsed && 'md:self-auto',
                                )}
                                onClick={handleSignOut}
                                title="Sign out"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

function ChannelLink({ railHidden, topic }: { railHidden: string; topic: Topic }) {
    return (
        <Link
            className={cn(
                'flex items-center gap-2 rounded-md px-2.5 py-1 font-mono text-[11.5px] text-muted no-underline hover:bg-elev/60',
                railHidden,
            )}
            search={{ priority: undefined, tags: [], topic: topic.name }}
            to="/app/channels"
        >
            <Dot level={hashTopicLevel(topic.name)} size={5} />

            <span className="flex-1 truncate">{topic.name}</span>

            {topic.isOwner && (
                <span className="flex flex-shrink-0" title="You own this topic">
                    <Crown className="text-dim" size={12} />
                </span>
            )}

            <AccessModeIcon accessMode={topic.accessMode} />
        </Link>
    );
}

const PLAN_PILL_STYLES: Record<PlanName, string> = {
    beam: 'bg-info/15 text-info',
    free: 'bg-elev text-dim',
    pulse: 'bg-accent/15 text-accent',
};

function PlanPill({ plan }: { plan: PlanName }) {
    return (
        <span
            className={`shrink-0 rounded px-1.5 py-px font-mono text-[9px] uppercase tracking-wide ${PLAN_PILL_STYLES[plan]}`}
        >
            {PLANS[plan].label}
        </span>
    );
}

function SidebarLink({ collapsed, item }: { collapsed: boolean; item: NavItem }) {
    const Icon = item.icon;

    const railHidden = collapsed ? 'md:hidden' : '';
    const railCentered = collapsed ? 'md:justify-center md:px-0' : '';

    return (
        <Link
            activeOptions={item.exact ? { exact: true } : undefined}
            activeProps={{ className: cn(ACTIVE, railCentered) }}
            className={cn(INACTIVE, railCentered)}
            title={collapsed ? item.label : undefined}
            to={item.to as never}
        >
            {({ isActive }) => (
                <>
                    <Icon className="shrink-0" size={14} />

                    <span className={cn('flex-1', railHidden)}>{item.label}</span>

                    {item.badge !== undefined && item.badge > 0 && (
                        <span
                            className={cn(
                                'font-mono text-[10px]',
                                isActive ? 'text-accent' : 'text-dim',
                                railHidden,
                            )}
                        >
                            {item.badge}
                        </span>
                    )}
                </>
            )}
        </Link>
    );
}
