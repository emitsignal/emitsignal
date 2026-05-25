import { ArrowRight, Terminal } from 'lucide-react';

import { Button } from './button';
import { HeroTerminal } from './hero-terminal';

const PARTNER_LOGOS = [
    'vercel',
    'linear',
    'planetscale',
    'supabase',
    'railway',
    'fly.io',
    'turso',
    'cal.com',
];

export function Hero() {
    return (
        <section className="relative overflow-hidden px-16 pb-16 pt-22">
            <HeroBackground />

            <div className="relative mx-auto grid max-w-[1280px] grid-cols-[1fr_1.05fr] items-center gap-16">
                <HeroCopy />
                <HeroTerminal />
            </div>

            <div className="relative mx-auto mt-16 max-w-[1280px]">
                <p className="mb-4 text-center font-mono text-[10.5px] tracking-[1.6px] text-dim">
                    USED BY 2,400+ DEV TEAMS · PUBLISHING 90M+ SIGNALS / MONTH
                </p>
                <div className="flex items-center justify-around gap-8 font-mono text-[14px] font-semibold text-muted opacity-55">
                    {PARTNER_LOGOS.map((name) => (
                        <span key={name}>{name}</span>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HeroBackground() {
    return (
        <>
            <div
                className="pointer-events-none absolute inset-0 opacity-35"
                style={{
                    backgroundImage:
                        'linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                    maskImage: 'radial-gradient(ellipse at 30% 40%, black 0%, transparent 70%)',
                    WebkitMaskImage:
                        'radial-gradient(ellipse at 30% 40%, black 0%, transparent 70%)',
                }}
            />
            <div
                className="pointer-events-none absolute left-[-10%] top-[20%] h-[600px] w-[600px] blur-3xl"
                style={{
                    background: 'radial-gradient(circle, rgba(91,33,182,0.4), transparent 60%)',
                }}
            />
        </>
    );
}

function HeroCopy() {
    return (
        <div>
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                v0.7.2 · the dev-native pubsub layer
            </div>

            <h1 className="m-0 font-sans text-[76px] font-semibold leading-[0.98] tracking-[-2.6px] text-fg">
                Push&nbsp;notifications
                <br />
                with{' '}
                <span
                    className="font-mono font-medium text-accent"
                    style={{
                        background:
                            'linear-gradient(180deg, var(--color-accent), var(--color-accent-dim))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    one curl
                </span>
                .
            </h1>

            <p className="mb-9 mt-7 max-w-[520px] font-sans text-[19px] leading-[1.55] text-muted">
                A pubsub layer for humans. Pipe anything into a topic from your shell, CI, cron, or
                a webhook — get it on your phone, terminal, slack, or email. No SDK. No account to
                start.
            </p>

            <TryItNowCurl />

            <div className="flex items-center gap-3">
                <Button icon={<ArrowRight size={13} />} to="/app" variant="primary">
                    Get started · free
                </Button>
                <Button href="#how" icon={<Terminal size={13} />}>
                    brew install emitsignal
                </Button>
                <span className="font-mono text-[12.5px] text-dim">· 30s setup</span>
            </div>
        </div>
    );
}

function TryItNowCurl() {
    return (
        <div className="mb-5.5 rounded-xl border border-line bg-deep px-4 py-3.5 font-mono text-[14px] leading-[1.5]">
            <p className="mb-2 text-[10px] tracking-[1.4px] text-dim">
                TRY IT NOW · NO ACCOUNT NEEDED
            </p>
            <div className="text-fg">
                <span className="text-success">$</span> <span className="text-dim">curl -d</span>{' '}
                <span className="text-warn">"hi from the marketing site"</span>{' '}
                <span className="text-accent">emitsignal.com/me-tryout</span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-accent">
                ✓ delivered · open this URL on your phone to read it →{' '}
                <span className="underline">emitsignal.com/r/me-tryout</span>
            </p>
        </div>
    );
}
