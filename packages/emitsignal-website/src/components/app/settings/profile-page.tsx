import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Avatar } from '#/components/ui/avatar';
import { useSession } from '#/ctx/session';
import { authClient } from '#/lib/auth-client';
import { queryKeys } from '#/lib/query-client';

import { SettingsButton } from './settings-button';
import { SettingsCard } from './settings-card';
import { SettingsField } from './settings-field';
import { SettingsInput } from './settings-input';

const API_URL = import.meta.env.VITE_API_URL as string;

export function ProfilePage() {
    const { user } = useSession();
    const queryClient = useQueryClient();

    const [avatarError, setAvatarError] = useState('');
    const [busy, setBusy] = useState(false);
    const [name, setName] = useState(user?.name ?? '');
    const [removing, setRemoving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Sync input once session data arrives (handles page-refresh case where
    // user is null on first render but populated after the session loads).
    const synced = useRef(false);

    useEffect(() => {
        if (user && !synced.current) {
            setName(user.name ?? '');
            synced.current = true;
        }
    }, [user]);

    const isDirty = name.trim() !== (user?.name ?? '');

    const handleSave = async () => {
        setBusy(true);
        setSaved(false);
        setSaveError('');

        const { error } = await authClient.updateUser({ name: name.trim() });

        setBusy(false);

        if (error) {
            setSaveError(error.message ?? 'Failed to save changes');
        } else {
            await queryClient.invalidateQueries({ queryKey: queryKeys.session });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setAvatarError('');
        setUploading(true);

        try {
            const form = new FormData();

            form.append('file', file);

            const response = await fetch(`${API_URL}/user/avatar`, {
                body: form,
                credentials: 'include',
                method: 'POST',
            });

            const json = (await response.json()) as { error?: string; imageUrl?: string };

            if (!response.ok) {
                throw new Error(
                    json.error === 'payload_too_large'
                        ? 'Image must be under 2 MB'
                        : 'Upload failed',
                );
            }

            await authClient.updateUser({ image: json.imageUrl } as Parameters<
                typeof authClient.updateUser
            >[0]);

            await queryClient.invalidateQueries({ queryKey: queryKeys.session });
        } catch (error) {
            setAvatarError(error instanceof Error ? error.message : 'Failed to upload image');
        }

        setUploading(false);

        if (fileRef.current) {
            fileRef.current.value = '';
        }
    };

    const handleAvatarRemove = async () => {
        setAvatarError('');
        setRemoving(true);

        try {
            const response = await fetch(`${API_URL}/user/avatar`, {
                credentials: 'include',
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to remove image');
            }

            await authClient.updateUser({ image: null } as Parameters<
                typeof authClient.updateUser
            >[0]);

            await queryClient.invalidateQueries({ queryKey: queryKeys.session });
        } catch {
            setAvatarError('Failed to remove image');
        }

        setRemoving(false);
    };

    return (
        <>
            <div className="mb-[26px] border-b border-line pb-[18px]">
                <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Profile</h1>
                <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-muted">
                    This is the public you, shown next to every signal you emit.
                </p>
            </div>

            <SettingsCard title="Identity">
                <div className="mb-[22px] flex flex-wrap items-center gap-4">
                    <Avatar
                        name={user?.name || user?.email || ''}
                        rounded={16}
                        size={72}
                        src={user?.image}
                    />

                    <div className="flex-1">
                        <div className="text-[17px] font-semibold">
                            {user?.name || user?.email || '—'}
                        </div>
                        <div className="mt-1 font-mono text-[12px] text-dim">{user?.email}</div>
                    </div>

                    <input
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        ref={fileRef}
                        type="file"
                    />

                    <div className="flex items-center gap-2">
                        {avatarError && (
                            <span className="font-mono text-[11px] text-danger">{avatarError}</span>
                        )}

                        <SettingsButton
                            disabled={uploading || removing}
                            icon={ImagePlus}
                            onClick={() => fileRef.current?.click()}
                            size="sm"
                        >
                            {uploading ? 'Uploading…' : 'Upload'}
                        </SettingsButton>

                        {user?.image && (
                            <SettingsButton
                                disabled={uploading || removing}
                                onClick={handleAvatarRemove}
                                size="sm"
                                variant="danger"
                            >
                                {removing ? 'Removing…' : 'Remove'}
                            </SettingsButton>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <SettingsField label="Display name">
                        <input
                            className="h-[38px] w-full rounded-[7px] border border-line bg-elev px-3 text-[13.5px] text-fg outline-none transition-colors focus:border-accent"
                            onChange={(event) => {
                                setName(event.target.value);
                                setSaved(false);
                                setSaveError('');
                            }}
                            placeholder="Your name"
                            value={name}
                        />
                    </SettingsField>
                    <SettingsField label="Email">
                        <SettingsInput value={user?.email ?? ''} />
                        <p className="mt-1.5 font-mono text-[11px] text-dim">
                            To change your email, contact support.
                        </p>
                    </SettingsField>
                </div>

                {(isDirty || saved || saveError) && (
                    <div className="mt-4 flex items-center justify-end gap-3">
                        {saveError && (
                            <span className="font-mono text-[12px] text-danger">{saveError}</span>
                        )}

                        {saved && !isDirty && (
                            <span className="font-mono text-[12px] text-success">
                                Changes saved
                            </span>
                        )}

                        {isDirty && (
                            <SettingsButton disabled={busy} onClick={handleSave} variant="primary">
                                {busy ? 'Saving…' : 'Save changes'}
                            </SettingsButton>
                        )}
                    </div>
                )}
            </SettingsCard>
        </>
    );
}
