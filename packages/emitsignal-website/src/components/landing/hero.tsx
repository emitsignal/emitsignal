import { ArrowRight } from 'lucide-react';

import { CopyButton } from '#/components/ui/copy-button';

import { Button } from './button';
import { HeroTerminal } from './hero-terminal';

const TRY_IT_COMMAND = 'curl -d "hi from the marketing site" emitsignal.com/me-tryout';

export function Hero() {
    return (
        <section className="relative overflow-hidden px-5 pb-10 pt-14 sm:px-8 md:px-16 md:pb-16 md:pt-22">
            <HeroBackground />

            <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 md:grid-cols-[1fr_1.05fr] md:gap-16">
                <HeroCopy />
                <HeroTerminal />
            </div>
        </section>
    );
}

function HeroBackground() {
    return (
        <div
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
                backgroundImage:
                    'linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
                maskImage: 'radial-gradient(ellipse at 30% 40%, black 0%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, black 0%, transparent 70%)',
            }}
        />
    );
}

function HeroCopy() {
    return (
        <div>
            <h1 className="m-0 font-sans text-[40px] font-semibold leading-[1.02] tracking-[-1.6px] text-fg sm:text-[48px] sm:tracking-[-2px] md:text-[56px] md:tracking-[-2.2px]">
                Push notifications with{' '}
                <span className="font-mono font-medium text-accent">one curl</span>.
            </h1>

            <p className="mb-8 mt-6 max-w-[520px] font-sans text-[19px] leading-[1.55] text-muted">
                Pipe anything into a topic from your shell, CI, or cron. Read it on your phone,
                terminal, or inbox.
            </p>

            <TryItNowCurl />

            <div className="flex flex-wrap items-center gap-3">
                <Button icon={<ArrowRight size={13} />} to="/app" variant="primary">
                    Get started
                </Button>
                <Button href="#how">How it works</Button>
            </div>
        </div>
    );
}

function TryItNowCurl() {
    return (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-line bg-deep px-4 py-3.5">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13.5px] leading-[1.5]">
                <span className="text-success">$</span> <span className="text-dim">curl -d</span>{' '}
                <span className="text-warn">"hi from the marketing site"</span>{' '}
                <span className="text-accent">emitsignal.com/me-tryout</span>
            </code>
            <CopyButton className="shrink-0" value={TRY_IT_COMMAND} />
        </div>
    );
}
