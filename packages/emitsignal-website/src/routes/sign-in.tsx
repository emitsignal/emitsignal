import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Logo } from '#/components/ui/logo';
import { authClient } from '#/lib/auth-client';
import { isAuthenticated } from '#/lib/auth-guard';
import { isAppleDevice } from '#/lib/is-apple-device';
import { queryKeys, sessionQueryOptions } from '#/lib/query-client';
import { buildSeoMeta } from '#/lib/seo';

export const Route = createFileRoute('/sign-in')({
    beforeLoad: async ({ context, preload }) => {
        if (preload) {
            return;
        }

        if (!import.meta.env.SSR) {
            const session = await context.queryClient.ensureQueryData(sessionQueryOptions);

            if (session?.user) {
                throw redirect({ to: '/app' });
            }

            return;
        }

        if (await isAuthenticated()) {
            throw redirect({ to: '/app' });
        }
    },
    component: SignInPage,
    head: () => buildSeoMeta({ noindex: true, path: '/sign-in', title: 'Sign in - EmitSignal' }),
});

function SignInPage() {
    const [appleBusy, setAppleBusy] = useState(false);
    const [busy, setBusy] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isApple, setIsApple] = useState(false);
    const [passkeyBusy, setPasskeyBusy] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const callbackURL = `${typeof window !== 'undefined' ? window.location.origin : ''}/app`;

    useEffect(() => {
        setIsApple(isAppleDevice());

        if (
            !PublicKeyCredential.isConditionalMediationAvailable ||
            !PublicKeyCredential.isConditionalMediationAvailable()
        ) {
            return;
        }

        void authClient.signIn.passkey({ autoFill: true });
    }, []);

    const handleSend = async () => {
        if (!email.trim()) {
            return;
        }

        setBusy(true);
        setError('');

        const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
            email: email.trim(),
            type: 'sign-in',
        });

        setBusy(false);

        if (sendError) {
            setError(sendError.message ?? 'Failed to send sign-in code');
        } else {
            navigate({ search: { email: email.trim(), otp: undefined }, to: '/verify' });
        }
    };

    const handleGitHub = async () => {
        await authClient.signIn.social({ callbackURL, provider: 'github' });
    };

    const handleApple = async () => {
        setAppleBusy(true);
        setError('');

        const { error: appleError } = await authClient.signIn.social({
            callbackURL,
            provider: 'apple',
        });

        if (appleError) {
            setAppleBusy(false);
            setError(appleError.message ?? 'Failed to sign in with Apple');
        }
    };

    const handlePasskey = async () => {
        setPasskeyBusy(true);
        setError('');

        const { data, error: passkeyError } = await authClient.signIn.passkey();

        setPasskeyBusy(false);

        if (passkeyError) {
            setError(passkeyError.message ?? 'Passkey sign-in failed');
        } else if (data) {
            queryClient.removeQueries({ queryKey: queryKeys.session });

            navigate({ to: '/app' });
        }
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
                    We'll email you a sign-in code. No passwords.
                </p>

                <label className="mb-2 block font-mono text-[10px] tracking-[1.5px] text-dim">
                    EMAIL
                </label>

                <input
                    autoCapitalize="off"
                    autoComplete="email webauthn"
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
                    {busy ? 'sending…' : 'send code →'}
                </button>

                <div className="mb-6 flex items-center gap-3">
                    <div className="flex-1 border-t border-line" />
                    <span className="font-mono text-[10px] text-dim">OR</span>
                    <div className="flex-1 border-t border-line" />
                </div>

                <button
                    className="mb-3 flex w-full items-center gap-2.5 rounded-lg border border-line bg-elev px-4 py-3 text-[13px] text-fg hover:bg-elev-2"
                    onClick={handleGitHub}
                >
                    <span className="font-mono">continue with GitHub</span>
                </button>
                <button
                    className="mb-3 flex w-full items-center gap-2.5 rounded-lg border border-line bg-elev px-4 py-3 text-[13px] text-fg hover:bg-elev-2 disabled:opacity-60"
                    disabled={passkeyBusy}
                    onClick={handlePasskey}
                >
                    <span className="font-mono">
                        {passkeyBusy ? 'authenticating…' : 'continue with passkey'}
                    </span>
                </button>

                {isApple && (
                    <button
                        className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-elev px-4 py-3 text-[13px] text-fg hover:bg-elev-2 disabled:opacity-60"
                        disabled={appleBusy}
                        onClick={handleApple}
                    >
                        <span className="font-mono">
                            {appleBusy ? 'connecting…' : 'continue with Apple'}
                        </span>
                    </button>
                )}

                <p className="mt-8 text-center font-mono text-[11px] leading-[18px] text-dim">
                    by continuing you agree to the
                    <br />
                    <Link className="text-accent no-underline hover:underline" to="/terms">
                        terms
                    </Link>{' '}
                    ·{' '}
                    <Link className="text-accent no-underline hover:underline" to="/privacy">
                        privacy
                    </Link>{' '}
                    ·{' '}
                    <Link
                        className="text-accent no-underline hover:underline"
                        to="/code-of-conduct"
                    >
                        code of conduct
                    </Link>
                </p>
            </div>
        </div>
    );
}
