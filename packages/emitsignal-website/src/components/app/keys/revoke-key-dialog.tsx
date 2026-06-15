import { AlertTriangle, Key } from 'lucide-react';
import { useState } from 'react';

import type { ApiKey } from '#/hooks/use-api-keys';

interface RevokeKeyDialogProps {
    apiKey: ApiKey | null;
    onClose: () => void;
    onConfirm: (id: string) => Promise<void>;
}

export function RevokeKeyDialog({ apiKey, onClose, onConfirm }: RevokeKeyDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!apiKey) {
        return null;
    }

    const maskedKey = `${apiKey.start ?? ''}••••••`;

    const handleConfirm = async () => {
        setLoading(true);

        try {
            await onConfirm(apiKey.id);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={onClose}
            style={{ backdropFilter: 'blur(3px)', background: 'rgba(6,3,15,0.72)' }}
        >
            <div
                className="w-full max-w-[440px] overflow-hidden rounded-[14px] border border-line bg-elev shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'kmodal .18s ease-out' }}
            >
                <div className="px-[22px] pb-[18px] pt-[22px]">
                    <div className="mb-3.5 flex items-center gap-3">
                        <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                            style={{ background: 'rgba(248,113,113,0.13)' }}
                        >
                            <AlertTriangle className="text-danger" size={16} />
                        </div>
                        <div className="text-[15px] font-semibold">
                            Revoke{' '}
                            <span className="font-mono text-danger">
                                {apiKey.name ?? 'this key'}
                            </span>
                            ?
                        </div>
                    </div>

                    <p className="text-[13px] leading-[1.55] text-muted">
                        Any service using this key will{' '}
                        <strong className="text-fg">immediately stop</strong> being able to publish
                        or read. This can&apos;t be undone — you&apos;d need to create a new key.
                    </p>

                    <div className="mt-3.5 flex items-center gap-2.5 rounded-lg border border-line bg-bg px-3.5 py-2.5">
                        <Key className="flex-shrink-0 text-dim" size={13} />
                        <span className="font-mono text-[12px] text-muted">{maskedKey}</span>
                    </div>
                </div>

                <div className="flex justify-end gap-2.5 px-[22px] pb-5 pt-3.5">
                    <button
                        className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-muted hover:text-fg"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold disabled:opacity-50"
                        disabled={loading}
                        onClick={() => void handleConfirm()}
                        style={{ background: 'var(--color-danger)', color: '#2a0a0a' }}
                    >
                        <AlertTriangle size={13} />
                        {loading ? 'Revoking...' : 'Revoke key'}
                    </button>
                </div>
            </div>

            <style>{`@keyframes kmodal{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}
