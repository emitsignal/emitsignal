import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';

import type { RevealData } from '#/components/app/keys/create-key-dialog';
import type { ApiKey } from '#/hooks/use-api-keys';

import { CreateKeyDialog } from '#/components/app/keys/create-key-dialog';
import { KeysTable } from '#/components/app/keys/keys-table';
import { RevokeKeyDialog } from '#/components/app/keys/revoke-key-dialog';
import { Toolbar } from '#/components/app/toolbar';
import { SubHeading } from '#/components/ui/sub-head';
import { useApiKeys } from '#/hooks/use-api-keys';
import { fetchApiKeysServer } from '#/lib/api-server-fns';
import { authClient } from '#/lib/auth-client';
import { queryKeys } from '#/lib/query-client';

export const Route = createFileRoute('/app/keys')({
    component: KeysPage,
    loader: async ({ context }) => {
        if (!import.meta.env.SSR) {
            return;
        }

        await context.queryClient
            .ensureQueryData({
                queryFn: () => fetchApiKeysServer(),
                queryKey: queryKeys.apiKeys,
                staleTime: 5 * 60_000,
            })
            .catch(() => undefined);
    },
});

interface Toast {
    kind: 'danger' | 'ok' | 'warn';
    msg: string;
}

function KeysPage() {
    const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
    const [rollReveal, setRollReveal] = useState<RevealData | undefined>(undefined);
    const [showCreate, setShowCreate] = useState(false);
    const [toast, setToast] = useState<null | Toast>(null);
    const { apiKeys, disable, loading, refresh, remove } = useApiKeys();
    const toastTimer = useRef<null | ReturnType<typeof setTimeout>>(null);

    const flash = (msg: string, kind: Toast['kind'] = 'ok') => {
        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
        }

        setToast({ kind, msg });

        toastTimer.current = setTimeout(() => setToast(null), 2400);
    };

    const handleRevoke = async (id: string) => {
        await disable(id);

        setRevokeTarget(null);
        flash('Key revoked — it can no longer authenticate', 'danger');
    };

    const handleDelete = async (id: string) => {
        await remove(id);

        flash('Key permanently deleted', 'danger');
    };

    const handleRoll = async (key: ApiKey) => {
        try {
            await remove(key.id);

            const { data, error: apiError } = await authClient.apiKey.create({
                name: key.name ?? 'untitled-key',
            });

            if (apiError) {
                throw new Error(apiError.message);
            }

            const secret = (data as { key: string }).key;

            await refresh();

            setRollReveal({ name: key.name ?? 'untitled-key', rolled: true, secret });
            setShowCreate(true);
        } catch (event) {
            flash(event instanceof Error ? event.message : 'Failed to roll key', 'danger');
        }
    };

    const handleCreateClose = () => {
        setShowCreate(false);
        setRollReveal(undefined);
    };

    const activeCount = apiKeys.filter((k) => k.enabled).length;

    return (
        <>
            <Toolbar
                actions={
                    <button
                        className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-[12px] font-semibold text-bg hover:bg-accent-dim"
                        onClick={() => setShowCreate(true)}
                    >
                        <Plus size={12} /> New key
                    </button>
                }
                subtitle={
                    loading ? '…' : `${activeCount} active key${activeCount === 1 ? '' : 's'}`
                }
                title="API Keys"
            />

            <div className="flex-1 overflow-auto px-5.5 py-5">
                <div className="mb-[10px] flex items-baseline justify-between">
                    <SubHeading>KEYS · {apiKeys.length}</SubHeading>
                    <span className="font-mono text-[10.5px] text-dim">
                        secrets are shown once at creation
                    </span>
                </div>

                <KeysTable
                    apiKeys={apiKeys}
                    loading={loading}
                    onDelete={(id) => void handleDelete(id)}
                    onFlash={flash}
                    onRevoke={setRevokeTarget}
                    onRoll={(key) => void handleRoll(key)}
                />
            </div>

            <CreateKeyDialog
                onClose={handleCreateClose}
                onCreated={refresh}
                open={showCreate}
                revealData={rollReveal}
            />

            <RevokeKeyDialog
                apiKey={revokeTarget}
                onClose={() => setRevokeTarget(null)}
                onConfirm={handleRevoke}
            />

            {toast && <Toast toast={toast} />}
        </>
    );
}

function Toast({ toast }: { toast: Toast }) {
    const color =
        toast.kind === 'danger'
            ? 'var(--color-danger)'
            : toast.kind === 'warn'
              ? 'var(--color-warn)'
              : 'var(--color-success)';
    return (
        <div
            className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2"
            style={{ animation: 'ktoast .2s ease-out' }}
        >
            <div
                className="flex items-center gap-2.5 rounded-[10px] border px-4 py-2.5 shadow-2xl"
                style={{
                    background: 'var(--color-elev-2)',
                    borderColor: color + '55',
                }}
            >
                <span
                    className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
                    style={{ background: color, boxShadow: `0 0 10px ${color}` }}
                />
                <span className="text-[13px] text-fg">{toast.msg}</span>
            </div>

            <style>{`@keyframes ktoast{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
        </div>
    );
}
