import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { GitBranch, Key, Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';

import { authClient } from '#/lib/auth-client';
import { relativeTime } from '#/lib/format';
import { queryKeys } from '#/lib/query-client';

import { SettingsButton } from './settings-button';
import { SettingsCard } from './settings-card';
import { SettingsGroup, SettingsRow } from './settings-group';
import { SettingsPill } from './settings-pill';

// ── helpers ──────────────────────────────────────────────────────────────────

type AccountItem = {
    accountId: string;
    providerId: string;
};

type PasskeyItem = {
    createdAt?: Date | null;
    deviceType: string;
    id: string;
    name?: null | string;
};

// ── types ─────────────────────────────────────────────────────────────────────

type SessionItem = {
    createdAt: Date | string;
    id: string;
    ipAddress?: null | string;
    token: string;
    updatedAt: Date | string;
    userAgent?: null | string;
};

export function AccountPage() {
    const { data: sessionData } = authClient.useSession();
    const currentToken = sessionData?.session?.token;
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Sessions
    const { data: sessions = [], isPending: sessionsLoading } = useQuery({
        queryFn: async () => {
            const { data } = await authClient.listSessions();
            return (data as null | SessionItem[]) ?? [];
        },
        queryKey: queryKeys.authSessions,
    });

    // Passkeys
    const [passkeyError, setPasskeyError] = useState('');
    const { data: passkeys = [], isPending: passkeysLoading } = useQuery({
        queryFn: async () => {
            const { data } = await authClient.passkey.listUserPasskeys({});
            return (data as null | PasskeyItem[]) ?? [];
        },
        queryKey: queryKeys.authPasskeys,
    });

    // Connected accounts
    const { data: accounts = [] } = useQuery({
        queryFn: async () => {
            const { data } = await authClient.listAccounts();
            return (data as AccountItem[] | null) ?? [];
        },
        queryKey: queryKeys.authAccounts,
    });

    // Delete account
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);

    // ── session handlers ─────────────────────────────────────────────────────

    const revokeSessionMutation = useMutation({
        mutationFn: async (token: string) => {
            const { error } = await authClient.revokeSession({ token });
            if (error) throw new Error(error.message ?? 'Failed to revoke session');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.authSessions }),
    });

    const revokeOthersMutation = useMutation({
        mutationFn: async () => {
            const { error } = await authClient.revokeOtherSessions();
            if (error) throw new Error(error.message ?? 'Failed to revoke sessions');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.authSessions }),
    });

    const handleRevokeSession = (token: string) => revokeSessionMutation.mutate(token);
    const handleRevokeOthers = () => revokeOthersMutation.mutate();

    const revokingOthers = revokeOthersMutation.isPending;
    const revokingToken = revokeSessionMutation.isPending ? revokeSessionMutation.variables : null;

    // ── passkey handlers ──────────────────────────────────────────────────────

    const addPasskeyMutation = useMutation({
        mutationFn: async () => {
            const { error } = await authClient.passkey.addPasskey({});
            if (error) throw new Error(error.message ?? 'Registration failed');
        },
        onError: (error: Error) => {
            if (!error.message.includes('cancel')) {
                setPasskeyError(error.message);
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.authPasskeys }),
    });

    const deletePasskeyMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await authClient.passkey.deletePasskey({ id });
            if (error) throw new Error(error.message ?? 'Failed to remove passkey');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.authPasskeys }),
    });

    const handleAddPasskey = () => {
        setPasskeyError('');
        addPasskeyMutation.mutate();
    };

    const handleDeletePasskey = (id: string) => deletePasskeyMutation.mutate(id);

    const addingPasskey = addPasskeyMutation.isPending;
    const deletingPasskeyId = deletePasskeyMutation.isPending
        ? deletePasskeyMutation.variables
        : null;

    // ── account link handlers ─────────────────────────────────────────────────

    const isGitHubLinked = accounts.some((a) => a.providerId === 'github');

    const [linkingGitHub, setLinkingGitHub] = useState(false);

    const unlinkGitHubMutation = useMutation({
        mutationFn: async () => {
            const { error } = await authClient.unlinkAccount({ providerId: 'github' });
            if (error) throw new Error(error.message ?? 'Failed to disconnect GitHub');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.authAccounts }),
    });

    const handleLinkGitHub = async () => {
        setLinkingGitHub(true);
        await authClient.linkSocial({
            callbackURL: window.location.href,
            provider: 'github',
        });
    };

    const handleUnlinkGitHub = () => unlinkGitHubMutation.mutate();

    const unlinkingGitHub = unlinkGitHubMutation.isPending;

    // ── delete account handler ────────────────────────────────────────────────

    const handleDeleteAccount = async () => {
        if (!confirmDelete) {
            return setConfirmDelete(true);
        }

        setDeleting(true);
        setDeleteError('');

        const { error } = await authClient.deleteUser({
            callbackURL: '/',
        });

        if (error) {
            setDeleting(false);
            setDeleteError(error.message ?? 'Deletion failed');

            return;
        }

        navigate({ replace: true, to: '/' });
    };

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <>
            <div className="mb-[26px] border-b border-line pb-[18px]">
                <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Account</h1>
                <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-muted">
                    Your private account: sign-in methods, connected services, and active sessions.
                </p>
            </div>

            <div>
                {/* ── Email ──────────────────────────────────────────────── */}
                <SettingsCard
                    description="Used for sign-in links and security notices."
                    title="Email address"
                >
                    <SettingsGroup>
                        <SettingsRow last>
                            <span className="flex-1 font-mono text-[13px]">
                                {sessionData?.user?.email ?? '—'}
                            </span>
                            <SettingsPill tone="accent-solid">PRIMARY</SettingsPill>
                            {sessionData?.user?.emailVerified && (
                                <SettingsPill tone="success">VERIFIED</SettingsPill>
                            )}
                        </SettingsRow>
                    </SettingsGroup>
                </SettingsCard>

                {/* ── Passkeys ───────────────────────────────────────────── */}
                <SettingsCard
                    action={
                        <SettingsButton
                            disabled={addingPasskey}
                            icon={Key}
                            onClick={handleAddPasskey}
                            variant="ghost"
                        >
                            {addingPasskey ? 'Registering…' : 'Add passkey'}
                        </SettingsButton>
                    }
                    description="Sign in with Touch ID, Face ID, or a hardware key."
                    title="Passkeys"
                >
                    {passkeyError && (
                        <p className="mb-3 font-mono text-[12px] text-danger">{passkeyError}</p>
                    )}
                    {passkeysLoading ? (
                        <p className="font-mono text-[12px] text-dim">Loading…</p>
                    ) : passkeys.length === 0 ? (
                        <p className="font-mono text-[12px] text-dim">
                            No passkeys registered yet.
                        </p>
                    ) : (
                        <SettingsGroup>
                            {passkeys.map((pk, index) => (
                                <SettingsRow key={pk.id} last={index === passkeys.length - 1}>
                                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[7px] border border-line bg-elev">
                                        {pk.deviceType === 'singleDevice' ? (
                                            <Smartphone className="text-accent" size={15} />
                                        ) : (
                                            <Monitor className="text-accent" size={15} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[13.5px] font-medium">
                                            {pk.name ?? 'Passkey'}
                                        </div>
                                        {pk.createdAt && (
                                            <div className="mt-0.5 font-mono text-[11px] text-dim">
                                                Added {relativeTime(pk.createdAt)}
                                            </div>
                                        )}
                                    </div>
                                    <SettingsButton
                                        disabled={deletingPasskeyId === pk.id}
                                        onClick={() => handleDeletePasskey(pk.id)}
                                        size="sm"
                                        variant="danger"
                                    >
                                        {deletingPasskeyId === pk.id ? 'Removing…' : 'Remove'}
                                    </SettingsButton>
                                </SettingsRow>
                            ))}
                        </SettingsGroup>
                    )}
                </SettingsCard>

                {/* ── Connected accounts ─────────────────────────────────── */}
                <SettingsCard
                    description="Link social providers to sign in without an email link."
                    title="Connected accounts"
                >
                    <SettingsGroup>
                        <SettingsRow last>
                            <div
                                className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[7px] border border-line bg-elev ${
                                    isGitHubLinked ? 'text-accent' : 'text-dim'
                                }`}
                            >
                                <GitBranch size={15} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[13.5px] font-medium">GitHub</div>
                                <div className="mt-0.5 font-mono text-[11px] text-dim">
                                    {isGitHubLinked ? 'Connected' : 'Not connected'}
                                </div>
                            </div>
                            {isGitHubLinked ? (
                                <SettingsButton
                                    disabled={unlinkingGitHub}
                                    onClick={handleUnlinkGitHub}
                                    size="sm"
                                    variant="ghost"
                                >
                                    {unlinkingGitHub ? 'Disconnecting…' : 'Disconnect'}
                                </SettingsButton>
                            ) : (
                                <SettingsButton
                                    disabled={linkingGitHub}
                                    onClick={handleLinkGitHub}
                                    size="sm"
                                    variant="primary"
                                >
                                    {linkingGitHub ? 'Connecting…' : 'Connect'}
                                </SettingsButton>
                            )}
                        </SettingsRow>
                    </SettingsGroup>
                </SettingsCard>

                {/* ── Active sessions ────────────────────────────────────── */}
                <SettingsCard
                    action={
                        sessions.filter((s) => s.token !== currentToken).length > 0 ? (
                            <SettingsButton
                                disabled={revokingOthers}
                                onClick={handleRevokeOthers}
                                size="sm"
                                variant="danger"
                            >
                                {revokingOthers ? 'Signing out…' : 'Sign out other devices'}
                            </SettingsButton>
                        ) : undefined
                    }
                    description="Sign out of devices that don't look familiar."
                    title="Active sessions"
                >
                    {sessionsLoading ? (
                        <p className="font-mono text-[12px] text-dim">Loading…</p>
                    ) : (
                        <SettingsGroup>
                            {sessions.map((s, index) => {
                                const isCurrent = s.token === currentToken;
                                return (
                                    <SettingsRow key={s.id} last={index === sessions.length - 1}>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13.5px] font-medium">
                                                    {parseUA(s.userAgent)}
                                                </span>
                                                {isCurrent && (
                                                    <SettingsPill tone="success">
                                                        THIS DEVICE
                                                    </SettingsPill>
                                                )}
                                            </div>
                                            <div className="mt-1 font-mono text-[11px] text-dim">
                                                {s.ipAddress ? `${s.ipAddress} · ` : ''}
                                                {relativeTime(s.updatedAt)}
                                            </div>
                                        </div>
                                        {!isCurrent && (
                                            <SettingsButton
                                                disabled={revokingToken === s.token}
                                                onClick={() => handleRevokeSession(s.token)}
                                                size="sm"
                                                variant="danger"
                                            >
                                                {revokingToken === s.token
                                                    ? 'Signing out…'
                                                    : 'Sign out'}
                                            </SettingsButton>
                                        )}
                                    </SettingsRow>
                                );
                            })}
                        </SettingsGroup>
                    )}
                </SettingsCard>

                {/* ── Close account ──────────────────────────────────────── */}
                <SettingsCard
                    className="border-danger/30"
                    description="Permanently deletes your account and all associated data. This cannot be undone."
                    title="Close account"
                >
                    <SettingsGroup className="border-danger/20">
                        <SettingsRow last>
                            {confirmDelete ? (
                                <div className="flex w-full items-center justify-between gap-4">
                                    <div>
                                        <div className="text-[13.5px] font-semibold text-danger">
                                            Are you sure?
                                        </div>
                                        <div className="mt-0.5 font-mono text-[11px] text-dim">
                                            This will permanently delete your account.
                                        </div>
                                        {deleteError && (
                                            <div className="mt-1 font-mono text-[11px] text-danger">
                                                {deleteError}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 gap-2">
                                        <SettingsButton
                                            disabled={deleting}
                                            onClick={() => setConfirmDelete(false)}
                                            size="sm"
                                            variant="ghost"
                                        >
                                            Cancel
                                        </SettingsButton>
                                        <SettingsButton
                                            disabled={deleting}
                                            onClick={handleDeleteAccount}
                                            size="sm"
                                            variant="danger"
                                        >
                                            {deleting ? 'Deleting…' : 'Yes, delete'}
                                        </SettingsButton>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1">
                                        <div className="text-[13.5px] font-semibold text-danger">
                                            Delete my account
                                        </div>
                                        <div className="mt-0.5 text-[12px] text-muted">
                                            Your inbox, keys, and personal data are erased. This
                                            cannot be undone.
                                        </div>
                                    </div>
                                    <SettingsButton
                                        onClick={() => setConfirmDelete(true)}
                                        size="sm"
                                        variant="danger"
                                    >
                                        Delete account
                                    </SettingsButton>
                                </>
                            )}
                        </SettingsRow>
                    </SettingsGroup>
                </SettingsCard>
            </div>
        </>
    );
}

function parseUA(ua?: null | string): string {
    if (!ua) return 'Unknown device';
    let browser = 'Browser';
    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';

    let os = '';
    if (ua.includes('iPhone')) os = 'iPhone';
    else if (ua.includes('iPad')) os = 'iPad';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Linux')) os = 'Linux';

    return os ? `${os} · ${browser}` : browser;
}
