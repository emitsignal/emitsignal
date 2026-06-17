import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Logo } from '#/components/ui/logo';
import { authClient } from '#/lib/auth-client';
import { isOnboardingComplete } from '#/lib/onboarding';

export const Route = createFileRoute('/verify')({
    component: VerifyPage,
    validateSearch: (search: Record<string, unknown>) => ({
        email: typeof search.email === 'string' ? search.email : undefined,
        otp:
            typeof search.otp === 'string'
                ? search.otp
                : typeof search.otp === 'number'
                  ? String(search.otp)
                  : undefined,
    }),
});

function VerifyPage() {
    const { email: emailParam, otp: otpParam } = Route.useSearch();

    const [busy, setBusy] = useState(false);
    const [codeFocused, setCodeFocused] = useState(false);
    const [email, setEmail] = useState(emailParam ?? '');
    const [error, setError] = useState('');
    const [otp, setOtp] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const signInWithOtp = useCallback(
        async (emailValue: string, otpValue: string) => {
            setBusy(true);
            setError('');

            const { data, error: err } = await authClient.signIn.emailOtp({
                email: emailValue,
                otp: otpValue,
            });

            setBusy(false);

            if (err) {
                setError(err.message ?? 'Invalid or expired code');
            } else {
                const onboarded = data?.user?.onboarded || isOnboardingComplete();

                navigate({ to: onboarded ? '/app' : '/onboarding' });
            }
        },
        [navigate],
    );

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!emailParam || !otpParam) {
            return;
        }

        signInWithOtp(emailParam, otpParam);
    }, [emailParam, otpParam, signInWithOtp]);

    const handleVerify = async () => {
        if (!otp.trim() || !email.trim()) {
            return;
        }

        await signInWithOtp(email.trim(), otp.trim());
    };

    const cells = Array.from({ length: 6 }, (_, i) => otp[i] ?? '');
    const activeIndex = otp.length;

    if (emailParam && otpParam) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-bg px-4">
                <div className="w-full max-w-[380px]">
                    <div className="mb-8">
                        <Link className="no-underline" to="/">
                            <Logo pulse size={14} />
                        </Link>
                    </div>

                    <h2 className="m-0 mb-1.5 text-[26px] font-semibold tracking-[-0.6px] text-fg">
                        {error ? 'Sign-in failed' : 'Signing you in…'}
                    </h2>

                    {error ? (
                        <>
                            <p className="m-0 mb-6 font-mono text-[12px] text-danger">{error}</p>
                            <Link className="font-mono text-[12px] text-accent" to="/sign-in">
                                ← back to sign in
                            </Link>
                        </>
                    ) : (
                        <p className="m-0 mb-6 text-[13px] text-muted">
                            Verifying your code, please wait…
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-bg px-4">
            <div className="w-full max-w-[380px]">
                <div className="mb-8">
                    <Link className="no-underline" to="/">
                        <Logo pulse size={14} />
                    </Link>
                </div>

                <h2 className="m-0 mb-1.5 text-[26px] font-semibold tracking-[-0.6px] text-fg">
                    Enter your code
                </h2>
                <p className="m-0 mb-6 text-[13px] text-muted">
                    {emailParam ? (
                        <>
                            We sent a 6-digit code to{' '}
                            <span className="font-mono text-fg">{emailParam}</span>. Tap the link or
                            enter the code below.
                        </>
                    ) : (
                        'Enter the 6-digit code we sent to your email.'
                    )}
                </p>

                {!emailParam && (
                    <>
                        <label className="mb-2 block font-mono text-[10px] tracking-[1.5px] text-dim">
                            EMAIL
                        </label>

                        <input
                            autoCapitalize="off"
                            autoComplete="email"
                            autoCorrect="off"
                            className="mb-4 w-full rounded-lg border border-line bg-elev px-4 py-3.5 font-mono text-[14px] text-fg outline-none placeholder:text-faint focus:border-accent"
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            type="email"
                            value={email}
                        />
                    </>
                )}

                <label className="mb-2.5 block font-mono text-[10px] tracking-[1.5px] text-dim">
                    CODE
                </label>

                <div className="relative mb-3.5 flex gap-2">
                    {cells.map((cell, index) => (
                        <div
                            className={`flex h-14 w-12 items-center justify-center rounded-lg border-[1.5px] font-mono text-[20px] font-semibold text-fg ${
                                codeFocused && index === activeIndex
                                    ? 'border-accent bg-elev'
                                    : 'border-line bg-elev'
                            }`}
                            key={index}
                        >
                            {cell}
                        </div>
                    ))}

                    <input
                        autoComplete="one-time-code"
                        className="absolute inset-0 cursor-text opacity-0"
                        inputMode="numeric"
                        maxLength={6}
                        onBlur={() => setCodeFocused(false)}
                        onChange={(event) =>
                            setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        onFocus={() => setCodeFocused(true)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                handleVerify();
                            }
                        }}
                        ref={inputRef}
                        style={{ caretColor: 'transparent' }}
                        value={otp}
                    />
                </div>

                <p className="mb-6 font-mono text-[11px] text-dim">
                    expires in <span className="text-warn">10 min</span>
                </p>

                {error && <p className="mb-4 font-mono text-[12px] text-danger">{error}</p>}

                <button
                    className="mb-4 w-full rounded-lg bg-accent px-4 py-3.5 text-center font-mono text-[14px] font-semibold text-bg hover:bg-accent-dim disabled:opacity-60"
                    disabled={busy || otp.length < 6}
                    onClick={handleVerify}
                >
                    {busy ? 'verifying…' : 'sign in →'}
                </button>

                <p className="text-center font-mono text-[12px] text-dim">
                    didn't arrive?{' '}
                    <button
                        className="cursor-pointer border-none bg-transparent p-0 font-mono text-[12px] text-accent"
                        onClick={() => navigate({ to: '/sign-in' })}
                    >
                        resend
                    </button>
                </p>
            </div>
        </div>
    );
}
