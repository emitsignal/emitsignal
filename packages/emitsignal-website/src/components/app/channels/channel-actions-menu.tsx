import { Link } from '@tanstack/react-router';
import { Book, Check, Crown, Globe, Lock, LogOut, Send, Settings2 } from 'lucide-react';
import { useState } from 'react';

import type { AccessMode, ListenSince, Subscription } from '#/lib/api';

import { useSubscriptions } from '#/ctx/subscriptions';
import { useToast } from '#/ctx/toast';
import { useBilling } from '#/hooks/use-billing';
import { useClaimTopic, useUpdateTopic } from '#/hooks/use-topics';
import { api } from '#/lib/api';
import { apiErrorMessage } from '#/lib/api-error';

interface ChannelActionsMenuProps {
    onUnsubscribed: () => void;
    subscription: Subscription;
    topicName: string;
}

const ACCESS_MODE_OPTIONS: {
    description: string;
    icon: typeof Globe;
    label: string;
    value: AccessMode;
}[] = [
    {
        description: 'Anyone can read and publish',
        icon: Globe,
        label: 'Public',
        value: 'public',
    },
    {
        description: 'Anyone can read; only members can publish',
        icon: Book,
        label: 'Read-only',
        value: 'readonly',
    },
    {
        description: 'Only members can read and publish',
        icon: Lock,
        label: 'Private',
        value: 'private',
    },
];

const LISTEN_SINCE_OPTIONS: {
    description: string;
    label: string;
    value: ListenSince;
}[] = [
    {
        description: 'Only messages published after you subscribe',
        label: 'New messages only',
        value: 'subscription_date',
    },
    {
        description: 'Include messages from before you subscribed',
        label: 'Include past messages',
        value: 'always',
    },
];

interface ChannelSettingsDialogProps {
    onClose: () => void;
    onFlash: (message: string, kind?: 'danger' | 'ok' | 'warn') => void;
    onSave: (input: {
        id: string;
        pushEnabled?: boolean;
        settings?: { description?: string; listenSince?: ListenSince };
    }) => Promise<void>;
    subscription: Subscription;
    topicName: string;
}

export function ChannelActionsMenu({
    onUnsubscribed,
    subscription,
    topicName,
}: ChannelActionsMenuProps) {
    const [manageOpen, setManageOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { billing } = useBilling();
    const { unsubscribe, updateSubscription } = useSubscriptions();
    const claimTopic = useClaimTopic();
    const toast = useToast();

    const isClaimed = Boolean(subscription.topic.ownerId);
    const isOwner = subscription.topic.isOwner ?? false;
    const isPaid = billing ? billing.plan !== 'free' : false;

    const handleClaim = async () => {
        setMenuOpen(false);

        try {
            await claimTopic.mutateAsync({ name: topicName });

            toast(`Reserved ${topicName} — you now own this topic`);
        } catch (error) {
            toast(apiErrorMessage(error, 'Failed to claim topic'), 'danger');
        }
    };

    const handleSendTest = async () => {
        setMenuOpen(false);

        try {
            await api.publish(topicName, {
                body: 'This is a test from EmitSignal',
                priority: 3,
                tags: ['test'],
                title: 'Test notification',
            });

            toast(`Test notification sent → ${topicName}`);
        } catch (error) {
            toast(apiErrorMessage(error, 'Failed to send test'), 'danger');
        }
    };

    const handleUnsubscribe = async () => {
        setMenuOpen(false);

        try {
            await unsubscribe(topicName);

            toast(`Unsubscribed from ${topicName}`, 'warn');
            onUnsubscribed();
        } catch (error) {
            toast(apiErrorMessage(error, 'Failed to unsubscribe'), 'danger');
        }
    };

    return (
        <div className="relative flex">
            <button
                className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-[12px] text-muted hover:bg-elev"
                onClick={() => setMenuOpen((open) => !open)}
            >
                <Settings2 size={13} /> options
            </button>

            {menuOpen && (
                <>
                    <div className="fixed inset-0 z-[25]" onClick={() => setMenuOpen(false)} />

                    <div
                        className="absolute right-0 top-8 z-30 w-[220px] overflow-hidden rounded-[9px] border border-line p-1 shadow-2xl"
                        style={{ background: 'var(--color-elev-2)' }}
                    >
                        <MenuItem icon={<Send size={13} />} onClick={() => void handleSendTest()}>
                            Send test notification
                        </MenuItem>

                        <MenuItem
                            icon={<Settings2 size={13} />}
                            onClick={() => {
                                setMenuOpen(false);
                                setSettingsOpen(true);
                            }}
                        >
                            Settings
                        </MenuItem>

                        <div className="my-1 h-px bg-line" />

                        {isOwner && (
                            <MenuItem
                                icon={<Crown size={13} />}
                                onClick={() => {
                                    setMenuOpen(false);
                                    setManageOpen(true);
                                }}
                            >
                                Manage topic
                            </MenuItem>
                        )}

                        {!isOwner && !isClaimed && isPaid && (
                            <MenuItem icon={<Crown size={13} />} onClick={() => void handleClaim()}>
                                Claim topic
                            </MenuItem>
                        )}

                        {!isOwner && !isClaimed && !isPaid && (
                            <div className="px-2.5 py-2 text-[11.5px] leading-snug text-dim">
                                <span className="flex items-center gap-1.5 font-medium text-muted">
                                    <Crown size={12} /> Claim topic
                                </span>
                                <p className="mt-1">
                                    Reserving a topic needs a paid plan.{' '}
                                    <Link
                                        className="text-accent hover:underline"
                                        onClick={() => setMenuOpen(false)}
                                        search={{
                                            checkout: undefined,
                                            interval: undefined,
                                            plan: undefined,
                                        }}
                                        to="/app/settings/billing"
                                    >
                                        Upgrade
                                    </Link>
                                </p>
                            </div>
                        )}

                        {(isOwner || !isClaimed) && <div className="my-1 h-px bg-line" />}

                        <MenuItem
                            danger
                            icon={<LogOut size={13} />}
                            onClick={() => void handleUnsubscribe()}
                        >
                            Unsubscribe
                        </MenuItem>
                    </div>
                </>
            )}

            {settingsOpen && (
                <ChannelSettingsDialog
                    onClose={() => setSettingsOpen(false)}
                    onFlash={toast}
                    onSave={updateSubscription}
                    subscription={subscription}
                    topicName={topicName}
                />
            )}

            {manageOpen && (
                <ManageTopicDialog
                    onClose={() => setManageOpen(false)}
                    onFlash={toast}
                    subscription={subscription}
                    topicName={topicName}
                />
            )}
        </div>
    );
}

function ChannelSettingsDialog({
    onClose,
    onFlash,
    onSave,
    subscription,
    topicName,
}: ChannelSettingsDialogProps) {
    const [description, setDescription] = useState(subscription.settings.description ?? '');
    const [listenSince, setListenSince] = useState<ListenSince>(subscription.settings.listenSince);
    const [pushEnabled, setPushEnabled] = useState(subscription.pushEnabled);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);

        try {
            await onSave({
                id: subscription.id,
                pushEnabled,
                settings: { description: description.trim(), listenSince },
            });

            onFlash('Channel settings saved');
            onClose();
        } catch (error) {
            onFlash(apiErrorMessage(error, 'Failed to save settings'), 'danger');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={onClose}
            style={{ backdropFilter: 'blur(3px)', background: 'rgba(6,3,15,0.72)' }}
        >
            <div
                className="w-full max-w-[480px] overflow-hidden rounded-[14px] border border-line bg-elev shadow-2xl"
                onClick={(event) => event.stopPropagation()}
                style={{ animation: 'kmodal .18s ease-out' }}
            >
                <div className="flex items-center gap-3 border-b border-line px-[22px] py-5">
                    <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'rgba(167,139,250,0.15)' }}
                    >
                        <Settings2 className="text-accent" size={16} />
                    </div>
                    <div>
                        <div className="text-[15px] font-semibold">Channel settings</div>
                        <div className="font-mono text-[12px] text-dim">{topicName}</div>
                    </div>
                </div>

                <div className="flex flex-col gap-[18px] px-[22px] py-5">
                    <div>
                        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[1.2px] text-dim">
                            Description
                        </div>
                        <input
                            className="w-full rounded-lg border border-line bg-bg px-3 py-[10px] text-[13.5px] outline-none focus:border-accent"
                            maxLength={280}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder={
                                subscription.topic.description ??
                                'Add a personal note for this channel'
                            }
                            value={description}
                        />
                    </div>

                    <button
                        className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg px-3.5 py-3 text-left"
                        onClick={() => setPushEnabled((enabled) => !enabled)}
                    >
                        <div>
                            <div className="text-[13.5px] font-medium">Push notifications</div>
                            <div className="text-[11.5px] text-dim">
                                Get notified when messages arrive
                            </div>
                        </div>
                        <Toggle enabled={pushEnabled} />
                    </button>

                    <div>
                        <div className="mb-2 font-mono text-[10px] uppercase tracking-[1.2px] text-dim">
                            Show messages
                        </div>

                        <div className="flex flex-col gap-2">
                            {LISTEN_SINCE_OPTIONS.map((option) => {
                                const selected = option.value === listenSince;

                                return (
                                    <button
                                        className="flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors"
                                        key={option.value}
                                        onClick={() => setListenSince(option.value)}
                                        style={{
                                            background: selected
                                                ? 'rgba(167,139,250,0.10)'
                                                : 'var(--color-bg)',
                                            borderColor: selected
                                                ? 'var(--color-accent)'
                                                : 'var(--color-line)',
                                        }}
                                    >
                                        <div>
                                            <div className="text-[13.5px] font-medium">
                                                {option.label}
                                            </div>
                                            <div className="text-[11.5px] text-dim">
                                                {option.description}
                                            </div>
                                        </div>
                                        {selected && (
                                            <Check
                                                className="flex-shrink-0 text-accent"
                                                size={16}
                                                strokeWidth={2.4}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2.5 border-t border-line px-[22px] py-4">
                    <button
                        className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-muted hover:text-fg"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-bg hover:bg-accent-dim disabled:opacity-50"
                        disabled={saving}
                        onClick={() => void handleSave()}
                    >
                        <Check size={13} />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <style>{`@keyframes kmodal{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}

function ManageTopicDialog({
    onClose,
    onFlash,
    subscription,
    topicName,
}: {
    onClose: () => void;
    onFlash: (message: string, kind?: 'danger' | 'ok' | 'warn') => void;
    subscription: Subscription;
    topicName: string;
}) {
    const [description, setDescription] = useState(subscription.topic.description ?? '');
    const [accessMode, setAccessMode] = useState<AccessMode>(
        subscription.topic.accessMode ?? 'public',
    );

    const updateTopic = useUpdateTopic();

    const handleSave = async () => {
        try {
            await updateTopic.mutateAsync({
                input: { accessMode, description: description.trim() },
                name: topicName,
            });

            onFlash('Topic settings saved');
            onClose();
        } catch (error) {
            onFlash(apiErrorMessage(error, 'Failed to save topic'), 'danger');
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={onClose}
            style={{ backdropFilter: 'blur(3px)', background: 'rgba(6,3,15,0.72)' }}
        >
            <div
                className="w-full max-w-[480px] overflow-hidden rounded-[14px] border border-line bg-elev shadow-2xl"
                onClick={(event) => event.stopPropagation()}
                style={{ animation: 'kmodal .18s ease-out' }}
            >
                <div className="flex items-center gap-3 border-b border-line px-[22px] py-5">
                    <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ background: 'rgba(167,139,250,0.15)' }}
                    >
                        <Crown className="text-accent" size={16} />
                    </div>
                    <div>
                        <div className="text-[15px] font-semibold">Manage topic</div>
                        <div className="font-mono text-[12px] text-dim">{topicName}</div>
                    </div>
                </div>

                <div className="flex flex-col gap-[18px] px-[22px] py-5">
                    <div>
                        <div className="mb-2 font-mono text-[10px] uppercase tracking-[1.2px] text-dim">
                            Access
                        </div>

                        <div className="flex flex-col gap-2">
                            {ACCESS_MODE_OPTIONS.map((option) => {
                                const selected = option.value === accessMode;
                                const Icon = option.icon;

                                return (
                                    <button
                                        className="flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors"
                                        key={option.value}
                                        onClick={() => setAccessMode(option.value)}
                                        style={{
                                            background: selected
                                                ? 'rgba(167,139,250,0.10)'
                                                : 'var(--color-bg)',
                                            borderColor: selected
                                                ? 'var(--color-accent)'
                                                : 'var(--color-line)',
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                className={selected ? 'text-accent' : 'text-dim'}
                                                size={16}
                                            />
                                            <div>
                                                <div className="text-[13.5px] font-medium">
                                                    {option.label}
                                                </div>
                                                <div className="text-[11.5px] text-dim">
                                                    {option.description}
                                                </div>
                                            </div>
                                        </div>
                                        {selected && (
                                            <Check
                                                className="flex-shrink-0 text-accent"
                                                size={16}
                                                strokeWidth={2.4}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[1.2px] text-dim">
                            Description
                        </div>
                        <input
                            className="w-full rounded-lg border border-line bg-bg px-3 py-[10px] text-[13.5px] outline-none focus:border-accent"
                            maxLength={280}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Describe what this topic is for"
                            value={description}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2.5 border-t border-line px-[22px] py-4">
                    <button
                        className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-muted hover:text-fg"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-bg hover:bg-accent-dim disabled:opacity-50"
                        disabled={updateTopic.isPending}
                        onClick={() => void handleSave()}
                    >
                        <Check size={13} />
                        {updateTopic.isPending ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <style>{`@keyframes kmodal{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}

function MenuItem({
    children,
    danger,
    icon,
    onClick,
}: {
    children: React.ReactNode;
    danger?: boolean;
    icon: React.ReactNode;
    onClick: () => void;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            className="flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[12.5px] font-medium transition-colors"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered
                    ? danger
                        ? 'rgba(248,113,113,0.10)'
                        : 'var(--color-elev)'
                    : 'transparent',
                color: danger ? 'var(--color-danger)' : 'var(--color-muted)',
            }}
        >
            {icon}

            {children}
        </button>
    );
}

function Toggle({ enabled }: { enabled: boolean }) {
    return (
        <span
            className="relative flex h-[22px] w-[38px] flex-shrink-0 items-center rounded-full transition-colors"
            style={{ background: enabled ? 'var(--color-accent)' : 'var(--color-line)' }}
        >
            <span
                className="absolute h-[16px] w-[16px] rounded-full bg-bg transition-transform"
                style={{ transform: enabled ? 'translateX(19px)' : 'translateX(3px)' }}
            />
        </span>
    );
}
