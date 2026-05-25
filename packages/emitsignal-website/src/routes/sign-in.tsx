import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { Logo } from '#/components/ui/logo';
import { api } from '#/lib/api';

export const Route = createFileRoute('/sign-in')({ component: SignInPage });

function SignInPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async () => {
        if (!email.trim()) {
            return;
        }

        setBusy(true);
        setError('');

        try {
            const result = await api.requestMagicLink(email.trim());

            navigate({
                search: { devCode: result.devCode ?? '', email: email.trim() },
                to: '/verify',
            });
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
        }

        setBusy(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-bg px-4">
            <div className="w-full max-w-[380px]">
                <div className="mb-8">
                    <Link className="no-underline" to="/">
                        <Logo pulse size={14} />
                    </Link>
                </div>

                <h2 className="m-0 mb-1.5 text-[26px] font-semibold tracking-[-0.6px] text-fg">
                    Sign in
                </h2>

                <p className="m-0 mb-6 text-[13px] text-muted">
                    We'll email you a magic link. No passwords.
                </p>

                <label className="mb-2 block font-mono text-[10px] tracking-[1.5px] text-dim">
                    EMAIL
                </label>

                <input
                    autoCapitalize="off"
                    autoCorrect="off"
                    className="mb-4 w-full rounded-lg border border-accent bg-elev px-4 py-3.5 font-mono text-[14px] text-fg outline-none placeholder:text-faint focus:border-accent"
                    onChange={(event) => setEmail(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') handleSend();
                    }}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                />

                {error && <p className="mb-4 font-mono text-[12px] text-danger">{error}</p>}

                <button
                    className="mb-5 w-full rounded-lg bg-accent px-4 py-3.5 text-center font-mono text-[14px] font-semibold text-bg hover:bg-accent-dim disabled:opacity-60"
                    disabled={busy}
                    onClick={handleSend}
                >
                    {busy ? 'sending…' : 'send magic link →'}
                </button>

                <div className="mb-6 flex items-center gap-3">
                    <div className="flex-1 border-t border-line" />
                    <span className="font-mono text-[10px] text-dim">OR</span>
                    <div className="flex-1 border-t border-line" />
                </div>

                <button
                    className="mb-3 flex w-full items-center gap-2.5 rounded-lg border border-line bg-elev px-4 py-3 text-[13px] text-fg hover:bg-elev-2"
                    onClick={handleSend}
                >
                    <span className="font-mono">continue with GitHub</span>
                    <span className="ml-auto font-mono text-[11px] text-dim">soon</span>
                </button>
                <button
                    className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-elev px-4 py-3 text-[13px] text-fg hover:bg-elev-2"
                    onClick={handleSend}
                >
                    <span className="font-mono">continue with Apple</span>
                    <span className="ml-auto font-mono text-[11px] text-dim">soon</span>
                </button>

                <p className="mt-8 text-center font-mono text-[11px] leading-[18px] text-dim">
                    by continuing you agree to the
                    <br />
                    <span className="text-accent">terms</span> ·{' '}
                    <span className="text-accent">privacy</span> ·{' '}
                    <span className="text-accent">acceptable use</span>
                </p>
            </div>
        </div>
    );
}
