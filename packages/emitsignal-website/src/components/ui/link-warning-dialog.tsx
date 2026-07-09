import { isSafeExternalUrl } from '@emitsignal/shared/url';
import { AlertTriangle, ExternalLink } from 'lucide-react';

import type { MediaRef } from '#/lib/api';

interface LinkWarningDialogProps {
    link: MediaRef | null;
    onClose: () => void;
}

export function LinkWarningDialog({ link, onClose }: LinkWarningDialogProps) {
    if (!link) {
        return null;
    }

    const safe = isSafeExternalUrl(link.href);

    const handleOpen = () => {
        if (safe) {
            window.open(link.href, '_blank', 'noopener,noreferrer');
        }

        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={onClose}
            style={{ backdropFilter: 'blur(3px)', background: 'rgba(6,3,15,0.72)' }}
        >
            <div
                className="w-full max-w-[460px] overflow-hidden rounded-[14px] border border-line bg-elev shadow-2xl"
                onClick={(event) => event.stopPropagation()}
                style={{ animation: 'kmodal .18s ease-out' }}
            >
                <div className="px-[22px] pb-[18px] pt-[22px]">
                    <div className="mb-3.5 flex items-center gap-3">
                        <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                            style={{ background: 'rgba(251,191,36,0.13)' }}
                        >
                            <AlertTriangle className="text-warn" size={16} />
                        </div>
                        <div className="text-[15px] font-semibold">External link</div>
                    </div>

                    <p className="text-[13px] leading-[1.55] text-muted">
                        You&apos;re about to open a link that is{' '}
                        <strong className="text-fg">not managed or verified by EmitSignal</strong>.
                        Check it below — you&apos;re opening it at your own risk.
                    </p>

                    {link.title ? (
                        <div className="mt-3.5 font-mono text-[12px] text-fg">{link.title}</div>
                    ) : null}

                    <div className="mt-2.5 max-h-[120px] overflow-auto rounded-lg border border-line bg-bg px-3.5 py-2.5">
                        <span className="break-all font-mono text-[12px] text-muted">
                            {link.href}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end gap-2.5 px-[22px] pb-5 pt-1">
                    <button
                        className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-muted hover:text-fg"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!safe}
                        onClick={handleOpen}
                        style={{ background: 'var(--color-warn)', color: '#2a1a00' }}
                        title={safe ? undefined : 'Blocked: unsupported URL scheme'}
                    >
                        <ExternalLink size={13} />
                        {safe ? 'Open link' : 'Link blocked'}
                    </button>
                </div>
            </div>

            <style>{`@keyframes kmodal{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}
