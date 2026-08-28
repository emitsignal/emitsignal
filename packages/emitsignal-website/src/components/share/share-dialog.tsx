import type { AccessMode } from '@emitsignal/shared/api';

import { shareUrl } from '@emitsignal/shared/share';
import { ArrowRight, Globe, KeyRound, Share2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { Message } from '#/lib/api';

import { ShareTargets } from '#/components/share/share-targets';
import { Avatar } from '#/components/ui/avatar';
import { CopyButton } from '#/components/ui/copy-button';
import { Pill } from '#/components/ui/pill';
import { SubHeading } from '#/components/ui/sub-head';
import { api } from '#/lib/api';
import { apiErrorMessage } from '#/lib/api-error';
import { useSiteOrigin } from '#/lib/site-origin';

export type ShareState =
    | { accessMode: AccessMode; kind: 'private'; topicName: string }
    | { kind: 'error'; message: string }
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'ready'; shareId: string };

interface ShareDialogProps {
    message: Message;
    onClose: () => void;
    onRetry: () => void;
    state: ShareState;
}

export function ShareDialog({ message, onClose, onRetry, state }: ShareDialogProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (state.kind === 'idle') {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }

            if (event.key !== 'Tab' || !panelRef.current) {
                return;
            }

            const focusable = panelRef.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
            );

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (!first || !last) {
                return;
            }

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, state.kind]);

    useEffect(() => {
        if (state.kind !== 'idle') {
            panelRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus();
        }
    }, [state.kind]);

    if (state.kind === 'idle') {
        return null;
    }

    const topicName = message.topicName ?? message.topicId;

    return (
        <div
            aria-label="Share message"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={onClose}
            role="dialog"
            style={{ backdropFilter: 'blur(3px)', background: 'var(--color-scrim)' }}
        >
            <div
                className="w-full max-w-[460px] overflow-hidden rounded-[14px] border border-line bg-elev shadow-2xl"
                onClick={(event) => event.stopPropagation()}
                ref={panelRef}
                style={{ animation: 'kmodal .18s ease-out' }}
            >
                <div className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
                    <Share2 className="text-accent" size={16} />
                    <span className="text-[15px] font-semibold">Share message</span>
                    <div className="flex-1" />
                    <button
                        aria-label="Close"
                        className="flex text-dim hover:text-fg"
                        onClick={onClose}
                        type="button"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex items-start gap-3 border-b border-line px-5 py-3.5">
                    <Avatar name={topicName} rounded={8} size={34} />
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 line-clamp-2 text-[13.5px] font-semibold leading-[1.35]">
                            {message.title}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-dim">
                            <span className="truncate">{topicName}</span>
                            {state.kind === 'ready' && (
                                <Pill tone="success">
                                    <Globe className="mr-1" size={10} />
                                    public
                                </Pill>
                            )}
                            {state.kind === 'private' && (
                                <Pill tone="warn">
                                    <KeyRound className="mr-1" size={10} />
                                    {state.accessMode}
                                </Pill>
                            )}
                        </div>
                    </div>
                </div>

                {state.kind === 'loading' && (
                    <div className="px-5 py-8 text-center font-mono text-[12px] text-dim">
                        creating link…
                    </div>
                )}

                {state.kind === 'error' && (
                    <div className="px-5 py-6">
                        <p className="mb-4 text-[12.5px] leading-[1.5] text-danger">
                            {state.message}
                        </p>
                        <button
                            className="h-10 w-full rounded-lg border border-line text-[12.5px] text-muted hover:text-fg"
                            onClick={onRetry}
                            type="button"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {state.kind === 'ready' && (
                    <PublicBranch message={message} shareId={state.shareId} topicName={topicName} />
                )}

                {state.kind === 'private' && (
                    <PrivateBranch
                        message={message}
                        onMadePublic={onRetry}
                        topicName={state.topicName}
                    />
                )}
            </div>

            <style>{`@keyframes kmodal{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}

function PrivateBranch({
    message,
    onMadePublic,
    topicName,
}: {
    message: Message;
    onMadePublic: () => void;
    topicName: string;
}) {
    const [isOwner, setIsOwner] = useState<boolean | null>(null);
    const [error, setError] = useState<null | string>(null);
    const [working, setWorking] = useState(false);
    const origin = useSiteOrigin();

    useEffect(() => {
        let cancelled = false;

        api.getTopic(topicName)
            .then((topic) => {
                if (!cancelled) {
                    setIsOwner(Boolean(topic.isOwner));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setIsOwner(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [topicName]);

    const makePublic = async () => {
        setWorking(true);
        setError(null);

        try {
            await api.updateTopic(topicName, { accessMode: 'public' });

            onMadePublic();
        } catch (caught) {
            setError(apiErrorMessage(caught, 'Could not update the topic.'));
            setWorking(false);
        }
    };

    return (
        <div className="px-5 py-4.5">
            <div className="mb-4 flex gap-3 rounded-[10px] border border-warn/25 bg-bg p-3.5">
                <KeyRound className="mt-0.5 shrink-0 text-warn" size={16} />
                <div>
                    <div className="mb-1 text-[13px] font-semibold">This topic is private</div>
                    <p className="m-0 text-[12px] leading-[1.5] text-muted">
                        A public share link only works for public topics. Make{' '}
                        <span className="font-mono text-warn">{topicName}</span> public to share
                        this message outside your workspace, or copy an internal link that still
                        requires sign-in.
                    </p>
                </div>
            </div>

            {error && <p className="mb-3 text-[12px] text-danger">{error}</p>}

            {isOwner && (
                <button
                    className="mb-2.5 flex h-10.5 w-full items-center justify-center gap-2 rounded-lg bg-accent text-[13px] font-semibold text-bg hover:bg-accent-dim disabled:opacity-60"
                    disabled={working}
                    onClick={makePublic}
                    type="button"
                >
                    <Globe size={14} />
                    {working ? 'Making public…' : 'Make topic public'}
                </button>
            )}

            <CopyButton
                className="h-10 w-full justify-center"
                value={`${origin}/app/inbox/${message.id}`}
            />
            <p className="mt-2 text-center font-mono text-[10.5px] text-dim">
                internal link · sign-in required
            </p>
        </div>
    );
}

function PublicBranch({
    message,
    shareId,
    topicName,
}: {
    message: Message;
    shareId: string;
    topicName: string;
}) {
    const [includePayload, setIncludePayload] = useState(false);
    const origin = useSiteOrigin();

    const url = shareUrl(origin, shareId, includePayload);

    return (
        <div className="px-5 py-4.5">
            <p className="m-0 mb-3.5 text-[12.5px] leading-[1.5] text-muted">
                Because <span className="font-mono text-accent">{topicName}</span> is public, anyone
                with this link can read the message — no account needed.
            </p>

            <div className="mb-3.5 flex gap-2">
                <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-bg px-3">
                    <Globe className="shrink-0 text-dim" size={13} />
                    <span className="truncate font-mono text-[12.5px] text-fg">
                        {url.replace(/^https?:\/\//, '')}
                    </span>
                </div>
                <CopyButton className="shrink-0 self-stretch" value={url} />
            </div>

            <label className="mb-4 flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-bg px-3 py-2.5">
                <input
                    checked={includePayload}
                    className="h-4 w-4 accent-accent"
                    onChange={(event) => setIncludePayload(event.target.checked)}
                    type="checkbox"
                />
                <span className="min-w-0">
                    <span className="block text-[12.5px] font-medium">Include raw payload</span>
                    <span className="block text-[11px] text-dim">
                        Show the message JSON on the public page
                    </span>
                </span>
            </label>

            <SubHeading>SHARE TO</SubHeading>
            <ShareTargets className="mb-4.5" title={message.title} url={url} />

            <a
                className="flex h-10.5 w-full items-center justify-center gap-2 rounded-lg border border-accent text-[13px] font-semibold text-accent no-underline hover:bg-accent/10"
                href={url}
                rel="noopener noreferrer"
                target="_blank"
            >
                Open public page
                <ArrowRight size={14} />
            </a>
        </div>
    );
}
