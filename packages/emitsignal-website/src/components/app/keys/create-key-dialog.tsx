import { AlertTriangle, Check, Key, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { authClient } from '#/lib/auth-client';

const EXPIRY_OPTIONS = [
    { label: 'Never', value: 'never' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
    { label: '1 year', value: '1y' },
] as const;

export interface RevealData {
    name: string;
    rolled?: boolean;
    secret: string;
}

interface CreateKeyDialogProps {
    onClose: () => void;
    onCreated: () => void;
    open: boolean;
    revealData?: RevealData;
}

type ExpiryValue = (typeof EXPIRY_OPTIONS)[number]['value'];

export function CreateKeyDialog({ onClose, onCreated, open, revealData }: CreateKeyDialogProps) {
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<null | string>(null);
    const [expiry, setExpiry] = useState<ExpiryValue>('never');
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [phase, setPhase] = useState<'form' | 'reveal'>(revealData ? 'reveal' : 'form');
    const [reveal, setReveal] = useState<null | RevealData>(revealData ?? null);

    useEffect(() => {
        if (!open) {
            setPhase('form');
            setName('');
            setExpiry('never');
            setReveal(null);
            setError(null);
            setCopied(false);
            setLoading(false);
        } else if (revealData) {
            setPhase('reveal');
            setReveal(revealData);
        }
    }, [open, revealData]);

    const handleCreate = async () => {
        const trimmedName = name.trim() || 'untitled-key';

        setLoading(true);
        setError(null);

        try {
            const expiresIn = expiryToSeconds(expiry);
            const { data, error: apiError } = await authClient.apiKey.create({
                ...(expiresIn !== null ? { expiresIn } : {}),
                name: trimmedName,
            });

            if (apiError) {
                throw new Error(apiError.message);
            }

            const secret = (data as { key: string }).key;

            setReveal({ name: trimmedName, secret });
            setPhase('reveal');
            onCreated();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create API key');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!reveal) {
            return;
        }

        await navigator.clipboard.writeText(reveal.secret);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const curlExample = reveal
        ? `curl emitsignal.sh/publish \\\n  -H "Authorization: Bearer ${reveal.secret}" \\\n  -d topic=my-topic -d "msg=hello"`
        : '';

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            onClick={onClose}
            style={{ backdropFilter: 'blur(3px)', background: 'rgba(6,3,15,0.72)' }}
        >
            <div
                className="w-full overflow-hidden rounded-[14px] border border-line bg-elev shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{
                    animation: 'kmodal .18s ease-out',
                    maxWidth: phase === 'reveal' ? 520 : 500,
                }}
            >
                {phase === 'form' ? (
                    <>
                        <div className="flex items-center gap-3 border-b border-line px-[22px] py-5">
                            <div
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                                style={{ background: 'rgba(167,139,250,0.15)' }}
                            >
                                <Key className="text-accent" size={16} />
                            </div>
                            <div>
                                <div className="text-[15px] font-semibold">Create API key</div>
                                <div className="text-[12px] text-dim">
                                    Used to authenticate{' '}
                                    <code className="font-mono text-accent">publish</code> &amp; API
                                    calls
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-[18px] px-[22px] py-5">
                            <div>
                                <div className="mb-1.5 flex items-baseline gap-2">
                                    <span className="text-[12.5px] font-semibold">Name</span>
                                    <span className="text-[11px] text-dim">
                                        A label so you remember where this key lives
                                    </span>
                                </div>

                                <input
                                    autoFocus
                                    className="w-full rounded-lg border border-line bg-bg px-3 py-[10px] text-[13.5px] outline-none focus:border-accent"
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') void handleCreate();
                                    }}
                                    placeholder="e.g. ci-runner, prod-write"
                                    value={name}
                                />

                                {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
                            </div>

                            <div>
                                <div className="mb-1.5">
                                    <span className="text-[12.5px] font-semibold">Auto-expire</span>
                                </div>

                                <div className="flex gap-2">
                                    {EXPIRY_OPTIONS.map(({ label, value }) => (
                                        <button
                                            className="flex-1 rounded-[7px] border py-2 text-center text-[12px] font-medium transition-colors"
                                            key={value}
                                            onClick={() => setExpiry(value)}
                                            style={{
                                                background:
                                                    expiry === value
                                                        ? 'rgba(167,139,250,0.15)'
                                                        : 'var(--color-bg)',
                                                borderColor:
                                                    expiry === value
                                                        ? 'var(--color-accent)'
                                                        : 'var(--color-line)',
                                                color:
                                                    expiry === value
                                                        ? 'var(--color-accent)'
                                                        : 'var(--color-muted)',
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
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
                                disabled={loading}
                                onClick={() => void handleCreate()}
                            >
                                <Plus size={13} />
                                {loading ? 'Creating...' : 'Create key'}
                            </button>
                        </div>
                    </>
                ) : (
                    reveal && (
                        <>
                            <div className="flex items-center gap-3 border-b border-line px-[22px] py-5">
                                <div
                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                                    style={{ background: 'rgba(74,222,128,0.14)' }}
                                >
                                    <Check
                                        size={17}
                                        strokeWidth={2.4}
                                        style={{ color: 'var(--color-success)' }}
                                    />
                                </div>
                                <div>
                                    <div className="text-[15px] font-semibold">
                                        {reveal.rolled ? 'Key re-issued' : 'Key created'} ·{' '}
                                        {reveal.name}
                                    </div>
                                    <div className="text-[12px] text-dim">
                                        Copy it now — you won&apos;t be able to see it again
                                    </div>
                                </div>
                            </div>

                            <div className="px-[22px] py-5">
                                <div
                                    className="flex items-center gap-2.5 rounded-[9px] border border-line px-3.5 py-3"
                                    style={{ background: 'var(--color-deep)' }}
                                >
                                    <Key className="flex-shrink-0 text-accent" size={14} />
                                    <span className="flex-1 break-all font-mono text-[12.5px] leading-snug text-fg">
                                        {reveal.secret}
                                    </span>
                                    <button
                                        className="flex-shrink-0 rounded-md border border-line px-2.5 py-1.5 text-[12px] font-semibold transition-colors"
                                        onClick={() => void handleCopy()}
                                        style={{
                                            color: copied
                                                ? 'var(--color-success)'
                                                : 'var(--color-muted)',
                                        }}
                                    >
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>

                                <div
                                    className="mt-4 flex gap-2.5 rounded-[9px] border px-3.5 py-3"
                                    style={{
                                        background: 'rgba(251,191,36,0.08)',
                                        borderColor: 'rgba(251,191,36,0.27)',
                                    }}
                                >
                                    <AlertTriangle
                                        className="mt-px flex-shrink-0 text-warn"
                                        size={15}
                                    />

                                    <p className="text-[12.5px] leading-[1.5] text-muted">
                                        This is the only time the full secret is shown. Store it in
                                        your secrets manager or CI now. If you lose it, roll the key
                                        to get a new one.
                                    </p>
                                </div>

                                <div className="mt-5">
                                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[1.5px] text-dim">
                                        USE IT
                                    </div>

                                    <pre
                                        className="overflow-x-auto rounded-lg p-3.5 font-mono text-[12px] leading-relaxed text-muted"
                                        style={{
                                            background: 'var(--color-bg)',
                                            border: '1px solid var(--color-line)',
                                        }}
                                    >
                                        {curlExample}
                                    </pre>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2.5 border-t border-line px-[22px] py-4">
                                <span className="font-mono text-[11px] text-dim">
                                    added to your key list
                                </span>
                                <button
                                    className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold text-bg hover:bg-accent-dim"
                                    onClick={onClose}
                                >
                                    <Check size={13} />
                                    Done — I&apos;ve copied it
                                </button>
                            </div>
                        </>
                    )
                )}
            </div>

            <style>{`@keyframes kmodal{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}

function expiryToSeconds(expiry: ExpiryValue): null | number {
    if (expiry === 'never') {
        return null;
    }

    const days = expiry === '30d' ? 30 : expiry === '90d' ? 90 : 365;

    return days * 24 * 60 * 60;
}
