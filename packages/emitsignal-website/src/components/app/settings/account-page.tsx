import { Eye, GitBranch, Globe, Key, MoreHorizontal, Plus } from 'lucide-react';

import { SettingsButton } from './settings-button';
import { SettingsCard } from './settings-card';
import { SettingsField } from './settings-field';
import { SettingsGroup, SettingsRow } from './settings-group';
import { SettingsInput } from './settings-input';
import { SettingsPill } from './settings-pill';
import { SettingsToggle } from './settings-toggle';

const CONNECTED_ACCOUNTS = [
    {
        icon: GitBranch,
        isConnected: true,
        isEnforced: false,
        key: 'github',
        label: 'GitHub',
        meta: '@alexc · connected',
    },
    {
        icon: Globe,
        isConnected: true,
        isEnforced: false,
        key: 'google',
        label: 'Google',
        meta: 'a.carter@gmail.com',
    },
    {
        icon: Key,
        isConnected: true,
        isEnforced: true,
        key: 'okta',
        label: 'Okta SSO',
        meta: 'acme.okta.com · enforced by workspace',
    },
    {
        icon: GitBranch,
        isConnected: false,
        isEnforced: false,
        key: 'gitlab',
        label: 'GitLab',
        meta: 'Not connected',
    },
] as const;

const ACTIVE_SESSIONS = [
    {
        device: 'MacBook Pro · Chrome 127',
        isCurrent: true,
        isUnrecognized: false,
        key: 'macbook',
        location: 'Amsterdam, NL',
        time: 'active now',
    },
    {
        device: 'iPhone 15 · EmitSignal iOS',
        isCurrent: false,
        isUnrecognized: false,
        key: 'iphone',
        location: 'Amsterdam, NL',
        time: '4m ago',
    },
    {
        device: 'wsp cli · 0.7.2 · darwin-arm',
        isCurrent: false,
        isUnrecognized: false,
        key: 'cli',
        location: 'Amsterdam, NL',
        time: '2h ago',
    },
    {
        device: 'Chrome · linux',
        isCurrent: false,
        isUnrecognized: true,
        key: 'unknown',
        location: 'AWS · us-east-1',
        time: '3d ago',
    },
] as const;

export function AccountPage() {
    return (
        <>
            <div className="mb-[26px] border-b border-line pb-[18px]">
                <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Account</h1>
                <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-muted">
                    Your private account: sign-in methods, security, connected services, and
                    language. None of this is visible to teammates.
                </p>
            </div>

            <div className="max-w-[760px]">
                <SettingsCard
                    action={
                        <SettingsButton icon={Plus} variant="ghost">
                            Add email
                        </SettingsButton>
                    }
                    description="The primary address receives security and billing notices."
                    title="Email addresses"
                >
                    <SettingsGroup>
                        <SettingsRow>
                            <span className="flex-1 font-mono text-[13px]">alex@acme.io</span>
                            <SettingsPill tone="accent-solid">PRIMARY</SettingsPill>
                            <SettingsPill tone="success">VERIFIED</SettingsPill>
                        </SettingsRow>
                        <SettingsRow last>
                            <span className="flex-1 font-mono text-[13px]">a.carter@gmail.com</span>
                            <SettingsPill tone="dim">BACKUP</SettingsPill>
                            <SettingsPill tone="success">VERIFIED</SettingsPill>
                            <MoreHorizontal className="shrink-0 text-dim" size={15} />
                        </SettingsRow>
                    </SettingsGroup>
                </SettingsCard>

                <SettingsCard title="Sign-in & security">
                    <SettingsGroup>
                        <SettingsRow>
                            <Key className="shrink-0 text-muted" size={16} />
                            <div className="flex-1">
                                <div className="text-[13.5px] font-medium">Password</div>
                                <div className="mt-0.5 font-mono text-[11px] text-dim">
                                    Last changed 4 months ago
                                </div>
                            </div>
                            <SettingsButton size="sm" variant="ghost">
                                Change
                            </SettingsButton>
                        </SettingsRow>
                        <SettingsRow>
                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/20">
                                <div className="h-2 w-2 rounded-full bg-success" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[13.5px] font-medium">
                                        Two-factor authentication
                                    </span>
                                    <SettingsPill tone="success">ON</SettingsPill>
                                </div>
                                <div className="mt-0.5 font-mono text-[11px] text-dim">
                                    Authenticator app · 8 backup codes left
                                </div>
                            </div>
                            <SettingsButton size="sm" variant="ghost">
                                Manage
                            </SettingsButton>
                        </SettingsRow>
                        <SettingsRow last>
                            <Eye className="shrink-0 text-muted" size={16} />
                            <div className="flex-1">
                                <div className="text-[13.5px] font-medium">Passkeys</div>
                                <div className="mt-0.5 font-mono text-[11px] text-dim">
                                    2 registered · MacBook Touch ID, iPhone Face ID
                                </div>
                            </div>
                            <SettingsButton size="sm" variant="ghost">
                                Add passkey
                            </SettingsButton>
                        </SettingsRow>
                    </SettingsGroup>
                </SettingsCard>

                <SettingsCard
                    description="Used for single sign-on and to link activity."
                    title="Connected accounts"
                >
                    <SettingsGroup>
                        {CONNECTED_ACCOUNTS.map((account, index) => {
                            const Icon = account.icon;
                            return (
                                <SettingsRow
                                    key={account.key}
                                    last={index === CONNECTED_ACCOUNTS.length - 1}
                                >
                                    <div
                                        className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[7px] border border-line bg-elev ${
                                            account.isConnected ? 'text-accent' : 'text-dim'
                                        }`}
                                    >
                                        <Icon size={15} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[13.5px] font-medium">
                                            {account.label}
                                        </div>
                                        <div className="mt-0.5 font-mono text-[11px] text-dim">
                                            {account.meta}
                                        </div>
                                    </div>
                                    {account.isEnforced ? (
                                        <SettingsPill tone="dim">ENFORCED</SettingsPill>
                                    ) : (
                                        <SettingsButton
                                            size="sm"
                                            variant={account.isConnected ? 'ghost' : 'primary'}
                                        >
                                            {account.isConnected ? 'Disconnect' : 'Connect'}
                                        </SettingsButton>
                                    )}
                                </SettingsRow>
                            );
                        })}
                    </SettingsGroup>
                </SettingsCard>

                <SettingsCard
                    action={
                        <SettingsButton size="sm" variant="danger">
                            Sign out all
                        </SettingsButton>
                    }
                    description="Sign out of devices that don't look familiar."
                    title="Active sessions"
                >
                    <SettingsGroup>
                        {ACTIVE_SESSIONS.map((session, index) => (
                            <SettingsRow
                                key={session.key}
                                last={index === ACTIVE_SESSIONS.length - 1}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13.5px] font-medium">
                                            {session.device}
                                        </span>
                                        {session.isCurrent ? (
                                            <SettingsPill tone="success">THIS DEVICE</SettingsPill>
                                        ) : null}
                                        {session.isUnrecognized ? (
                                            <SettingsPill tone="warn">UNRECOGNIZED</SettingsPill>
                                        ) : null}
                                    </div>
                                    <div className="mt-1 font-mono text-[11px] text-dim">
                                        {session.location} · {session.time}
                                    </div>
                                </div>
                                {session.isCurrent ? null : (
                                    <SettingsButton size="sm" variant="danger">
                                        Sign out
                                    </SettingsButton>
                                )}
                            </SettingsRow>
                        ))}
                    </SettingsGroup>
                </SettingsCard>

                <SettingsCard title="Language & region">
                    <div className="grid grid-cols-2 gap-3.5">
                        <SettingsField label="Language">
                            <SettingsInput value="English (US)" />
                        </SettingsField>
                        <SettingsField label="Time zone">
                            <SettingsInput value="Europe/Amsterdam" />
                        </SettingsField>
                        <SettingsField label="Date format">
                            <SettingsInput monospace value="DD MMM YYYY · 24h" />
                        </SettingsField>
                        <SettingsField label="First day of week">
                            <SettingsInput value="Monday" />
                        </SettingsField>
                    </div>
                </SettingsCard>

                <SettingsCard
                    className="border-danger/30"
                    description="Leaves every workspace and permanently deletes your personal account."
                    title="Close account"
                >
                    <SettingsToggle
                        danger
                        description="Your inbox, keys, and personal data are erased. Channels you own must be transferred first. This cannot be undone."
                        label="Delete my account"
                    />
                </SettingsCard>
            </div>
        </>
    );
}
