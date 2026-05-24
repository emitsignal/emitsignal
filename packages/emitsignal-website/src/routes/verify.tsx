import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { Logo } from '#/components/ui/logo';
import { useSession } from '#/ctx/session';
import { api } from '#/lib/api';

interface VerifySearch {
    devCode: string;
    email: string;
}

export const Route = createFileRoute('/verify')({
    component: VerifyPage,
    validateSearch: (search: Record<string, unknown>): VerifySearch => ({
        devCode: (search.devCode as string) ?? '',
        email: (search.email as string) ?? '',
    }),
});

function VerifyPage() {
    const [busy, setBusy] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const { devCode, email } = Route.useSearch();
    const { signIn } = useSession();
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (devCode && code === '') {
            let i = 0;

            const id = setInterval(() => {
                i++;
                setCode(devCode.slice(0, i));
                if (i >= devCode.length) clearInterval(id);
            }, 380);
            return () => clearInterval(id);
        }
    }, [devCode]);

    const handleVerify = async () => {
        if (!email || code.length !== 6) {
            return;
        }

        setBusy(true);
        setError('');

        try {
            const res = await api.verifyMagicLink(email, code);

            await signIn(res.token, res.user);

            navigate({ to: '/app' });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    };

    const cells = Array.from({ length: 6 }, (_, i) => code[i] ?? '');
    const activeIdx = code.length;

    const handleInputChange = (value: string) => {
        setCode(
            value
                .replace(/[^a-z0-9]/gi, '')
                .toLowerCase()
                .slice(0, 6),
        );
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
                    Check your email
                </h2>
                <p className="m-0 mb-6 text-[13px] text-muted">
                    We sent a 6-char code to <span className="font-mono text-fg">{email}</span>. Tap
                    the link or paste the code here.
                </p>

                <label className="mb-2.5 block font-mono text-[10px] tracking-[1.5px] text-dim">
                    CODE
                </label>

                <div className="mb-3.5 flex gap-2" onClick={() => inputRef.current?.focus()}>
                    {cells.map((cell, index) => (
                        <div
                            className={`flex h-14 w-12 items-center justify-center rounded-lg border-1.5 font-mono text-[20px] font-semibold text-fg ${
                                index === activeIdx
                                    ? 'border-accent bg-elev'
                                    : 'border-line bg-elev'
                            }`}
                            key={index}
                        >
                            {cell}
                        </div>
                    ))}
                    <input
                        autoCapitalize="off"
                        autoCorrect="off"
                        className="absolute h-0 w-0 opacity-0"
                        maxLength={6}
                        onChange={(event) => handleInputChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                handleVerify();
                            }
                        }}
                        ref={inputRef}
                        value={code}
                    />
                </div>

                <p className="mb-6 font-mono text-[11px] text-dim">
                    expires in <span className="text-warn">10 min</span>
                </p>

                {error && <p className="mb-4 font-mono text-[12px] text-danger">{error}</p>}

                <button
                    className="mb-4 w-full rounded-lg bg-accent px-4 py-3.5 text-center font-mono text-[14px] font-semibold text-bg hover:bg-accent-dim disabled:opacity-60"
                    disabled={busy || code.length !== 6}
                    onClick={handleVerify}
                >
                    {busy ? 'verifying…' : 'verify →'}
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
