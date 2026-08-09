import { Link } from '@tanstack/react-router';

import { APP_STORE_URL } from '#/lib/links';

import { FloatingTiles } from './floating-tiles';

export function Hero() {
    return (
        <section className="relative overflow-hidden px-6 pb-16 pt-40 md:px-12 md:pb-24 md:pt-48">
            <HeroBackground />
            <FloatingTiles />

            <div className="relative mx-auto max-w-[1000px] text-center">
                <h1 className="m-0 text-[46px] font-medium leading-[0.95] tracking-[-0.035em] text-fg sm:text-[68px] lg:text-[96px]">
                    Push notifications
                    <br />
                    with{' '}
                    <span className="font-medium tracking-[-0.05em] text-accent">one curl</span>.
                </h1>

                <p className="mx-auto mb-10 mt-8 max-w-[600px] text-[18px] leading-[1.6] text-muted md:text-[20px]">
                    Pipe anything into a topic from your shell, CI, or cron. Read it on your phone,
                    in your terminal, or in the web inbox.
                </p>

                <p className="m-0 text-[13px] text-dim">
                    Also on your phone:{' '}
                    <a
                        className="text-muted underline underline-offset-4"
                        href={APP_STORE_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        iOS
                    </a>{' '}
                    ·{' '}
                    <Link className="text-muted underline underline-offset-4" to="/mobile">
                        Android
                    </Link>
                </p>
            </div>
        </section>
    );
}

function HeroBackground() {
    return (
        <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
                backgroundImage:
                    'linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)',
                backgroundSize: '72px 72px',
                maskImage:
                    'radial-gradient(ellipse 70% 60% at 50% 35%, black 0%, transparent 100%)',
                WebkitMaskImage:
                    'radial-gradient(ellipse 70% 60% at 50% 35%, black 0%, transparent 100%)',
            }}
        />
    );
}
