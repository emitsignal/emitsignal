import type { ListenSince, Subscription } from '#/lib/api';

import { Check, LogOut, Send, Settings2 } from 'lucide-react';
import { useState } from 'react';

import { useSubscriptions } from '#/ctx/subscriptions';
import { api } from '#/lib/api';

interface ChannelActionsMenuProps {
    onFlash: (message: string, kind?: 'danger' | 'ok' | 'warn') => void;
    subscription: Subscription;
    topicName: string;
}

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

export function ChannelActionsMenu({ onFlash, subscription, topicName }: ChannelActionsMenuProps) {
    const { unsubscribe, updateSubscription } = useSubscriptions();
    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleSendTest = async () => {
        setMenuOpen(false);

        try {
            await api.publish(topicName, {
                body: 'This is a test from EmitSignal',
                priority: 3,
                tags: ['test'],
                title: 'Test notification',
            });

            onFlash(`Test notification sent → ${topicName}`);
        } catch (error) {
            onFlash(error instanceof Error ? error.message : 'Failed to send test', 'danger');
        }
    };

    const handleUnsubscribe = async () => {
        setMenuOpen(false);

        try {
            await unsubscribe(topicName);

            onFlash(`Unsubscribed from ${topicName}`, 'warn');
        } catch (error) {
            onFlash(error instanceof Error ? error.message : 'Failed to unsubscribe', 'danger');
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
                    onFlash={onFlash}
                    onSave={updateSubscription}
                    subscription={subscription}
                    topicName={topicName}
                />
            )}
        </div>
    );
}

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
            onFlash(error instanceof Error ? error.message : 'Failed to save settings', 'danger');
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
