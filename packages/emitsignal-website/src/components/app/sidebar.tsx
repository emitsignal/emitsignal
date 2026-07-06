import type { PlanName } from '@emitsignal/shared/billing';

import { PLANS } from '@emitsignal/shared/billing';
import { TOPIC_NAME_MAX_LENGTH } from '@emitsignal/shared/topic';
import { Link, useNavigate } from '@tanstack/react-router';
import {
    Bell,
    Key,
    LayoutGrid,
    Lock,
    LogOut,
    type LucideIcon,
    Plus,
    Settings,
    Terminal,
    Webhook,
} from 'lucide-react';
import { useState } from 'react';

import { ThemeToggle } from '#/components/app/theme-toggle';
import { Avatar } from '#/components/ui/avatar';
import { Dot } from '#/components/ui/dot';
import { Logo } from '#/components/ui/logo';
import { useSession } from '#/ctx/session';
import { useSubscriptions } from '#/ctx/subscriptions';
import { useToast } from '#/ctx/toast';
import { useBilling } from '#/hooks/use-billing';
import { apiErrorMessage } from '#/lib/api-error';
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
    const { subscribe, subscriptions } = useSubscriptions();
    const navigate = useNavigate();
    const toast = useToast();

    const plan = billing?.plan;

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
        <aside className="flex w-[250px] shrink-0 flex-col gap-0.5 border-r border-line p-2.5 pt-4">
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
                    search={{ priority: undefined, tags: [], topic: subscription.topic.name }}
                    to="/app/channels"
                >
                    <Dot level={hashTopicLevel(subscription.topic.name)} size={5} />

                    <span className="flex-1 truncate">{subscription.topic.name}</span>

                    {subscription.topic.accessMode !== 'public' && (
                        <Lock className="flex-shrink-0 text-dim" size={12} />
                    )}
                </Link>
            ))}

            <div className="mt-auto">
                <div className="px-2.5 pb-2 pt-2.5">
                    <ThemeToggle />
                </div>

                {user && (
                    <div className="flex items-center gap-2.5 border-t border-line p-2.5">
                        <Avatar
                            name={user.name || user.email}
                            rounded={100}
                            size={30}
                            src={user.image}
                        />

                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                                <span className="truncate text-[12.5px] font-medium text-fg">
                                    {user.name || user.email.split('@')[0]}
                                </span>

                                {plan && <PlanPill plan={plan} />}
                            </div>

                            <span className="truncate text-[11px] text-dim">{user.email}</span>
                        </div>

                        <button
                            className="cursor-pointer self-start rounded p-1 text-dim hover:bg-elev hover:text-fg"
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
