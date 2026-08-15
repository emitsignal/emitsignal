import type { PushToken } from '@emitsignal/shared/api';

import { Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';

import { relativeTime } from '#/lib/format';

import { SettingsButton } from './settings-button';

interface DeviceRowProps {
    onRemove: (id: string) => void;
    onToggle: (id: string, pushEnabled: boolean) => void;
    removing?: boolean;
    toggling?: boolean;
    token: PushToken;
}

const PLATFORM_LABEL: Record<string, string> = {
    android: 'Android',
    ios: 'iOS',
    web: 'Browser',
};

export function deviceLabel(token: PushToken): string {
    if (token.deviceName) {
        return token.deviceName;
    }

    const platform = PLATFORM_LABEL[token.platform] ?? token.platform;

    return `${platform} · …${token.deviceId.slice(-6)}`;
}

export function DeviceRow({
    onRemove,
    onToggle,
    removing = false,
    toggling = false,
    token,
}: DeviceRowProps) {
    const [confirming, setConfirming] = useState(false);

    const Icon = token.platform === 'web' ? Monitor : Smartphone;
    const busy = removing || toggling;

    return (
        <div className="flex items-center gap-3.5 border-b border-line px-4 py-3.5 last:border-b-0">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[7px] border border-line bg-elev">
                <Icon className="text-accent" size={15} />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-medium">{deviceLabel(token)}</span>
                </div>

                <div className="mt-0.5 truncate font-mono text-[11px] text-dim">
                    {token.appId ? `${token.appId} · ` : ''}
                    Registered {relativeTime(token.createdAt)} · Last seen{' '}
                    {relativeTime(token.updatedAt)}
                </div>
            </div>

            {confirming ? (
                <div className="flex shrink-0 gap-2">
                    <SettingsButton
                        disabled={busy}
                        onClick={() => setConfirming(false)}
                        size="sm"
                        variant="ghost"
                    >
                        Cancel
                    </SettingsButton>

                    <SettingsButton
                        disabled={busy}
                        onClick={() => onRemove(token.id)}
                        size="sm"
                        variant="danger"
                    >
                        {removing ? 'Removing…' : 'Yes, remove'}
                    </SettingsButton>
                </div>
            ) : (
                <>
                    <button
                        aria-checked={token.pushEnabled}
                        aria-label={`Push notifications for ${deviceLabel(token)}`}
                        className="shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={busy}
                        onClick={() => onToggle(token.id, !token.pushEnabled)}
                        role="switch"
                        type="button"
                    >
                        <div
                            className={`flex h-5 w-9 items-center rounded-full border px-0.5 transition-all ${
                                token.pushEnabled
                                    ? 'justify-end border-accent bg-accent'
                                    : 'justify-start border-line bg-chip'
                            }`}
                        >
                            <div
                                className={`h-3.5 w-3.5 rounded-full ${token.pushEnabled ? 'bg-bg' : 'bg-dim'}`}
                            />
                        </div>
                    </button>

                    <SettingsButton
                        disabled={busy}
                        onClick={() => setConfirming(true)}
                        size="sm"
                        variant="danger"
                    >
                        Remove
                    </SettingsButton>
                </>
            )}
        </div>
    );
}
