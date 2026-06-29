import { useState } from 'react';

export function NewsletterCta() {
    const [done, setDone] = useState(false);
    const [email, setEmail] = useState('');

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        if (email.includes('@')) {
            setDone(true);
        }
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-b from-accent/[0.07] to-transparent p-6 md:p-8">
            <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[2px] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                The Signal · newsletter
            </div>

            <div className="mb-2 font-sans text-xl font-semibold tracking-tight text-fg md:text-2xl">
                One email when we ship something good.
            </div>

            <p className="mb-5 max-w-md text-[13.5px] leading-[1.55] text-muted">
                Product news, engineering deep dives, and the occasional 4am postmortem. No spam —
                routed through our own pipe, naturally.
            </p>

            <form className="flex max-w-sm gap-2" onSubmit={handleSubmit}>
                <input
                    className="flex-1 rounded-lg border border-line bg-deep px-3.5 py-2.5 font-mono text-[13px] text-fg outline-none placeholder:text-faint focus:border-accent/50"
                    disabled={done}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@dev.sh"
                    type="email"
                    value={email}
                />

                <button
                    className="whitespace-nowrap rounded-lg bg-accent px-4 py-2.5 font-mono text-[13px] font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-70"
                    disabled={done}
                    type="submit"
                >
                    {done ? '✓ subscribed' : 'Subscribe'}
                </button>
            </form>
        </div>
    );
}
