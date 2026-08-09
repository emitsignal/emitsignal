import { ArrowUpRight, BookOpen } from 'lucide-react';

import { DOCS_URL, REPO_URL } from '#/lib/links';

import { Button } from './button';
import { Eyebrow } from './eyebrow';
import { HeroTerminal } from './hero-terminal';
import { Reveal } from './reveal';
import { Section } from './section';

interface Command {
    detail: string;
    example: string;
    name: string;
}

const COMMANDS: Command[] = [
    {
        detail: 'Send a signal to any topic. Reads stdin, so it pipes.',
        example: 'emitsignal publish alerts/prod -p5',
        name: 'publish',
    },
    {
        detail: 'Tail one topic or all of them, like logs.',
        example: 'emitsignal listen alerts/prod',
        name: 'listen',
    },
    {
        detail: 'Full-screen inbox, without leaving the terminal.',
        example: 'emitsignal tui',
        name: 'tui',
    },
];

export function CliSection() {
    return (
        <Section className="py-20 md:py-28" id="cli">
            <Reveal>
                <div className="max-w-[720px]">
                    <Eyebrow>Command line</Eyebrow>

                    <h2 className="m-0 text-[32px] font-medium leading-[1.05] tracking-[-0.03em] text-fg md:text-[44px]">
                        A first-class terminal inbox.
                    </h2>

                    <p className="m-0 mt-4 max-w-[62ch] text-[16px] leading-[1.6] text-muted">
                        Tail your topics the way you tail logs, pipe a signal in from any script, or
                        open the full TUI. No browser tab required.
                    </p>
                </div>

                {/* items-start, not stretch: the terminal is a fixed-height object, so stretching
                    it to match the panel would just park dead space below the caret. */}
                <div className="mt-10 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.15fr_1fr]">
                    <HeroTerminal streamHeight={244} />
                    <CommandPanel />
                </div>
            </Reveal>
        </Section>
    );
}

function CommandPanel() {
    return (
        <div className="flex flex-col rounded-xl border border-line bg-elev p-6">
            <p className="m-0 font-mono text-[10px] uppercase tracking-[1.6px] text-faint">
                Three verbs, that's the whole CLI
            </p>

            <div className="mt-3.5 flex flex-col gap-px overflow-hidden rounded-lg border border-line bg-line">
                {COMMANDS.map((command) => (
                    <div className="bg-elev px-4 py-3" key={command.name}>
                        <p className="m-0 flex items-baseline gap-2.5">
                            <span className="font-mono text-[13px] font-semibold text-accent">
                                {command.name}
                            </span>
                            <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-dim">
                                $ {command.example}
                            </span>
                        </p>
                        <p className="m-0 mt-1 text-[12.5px] leading-[1.45] text-muted">
                            {command.detail}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-6">
                <p className="m-0 font-mono text-[11px] text-dim">
                    No SDK to install. AGPL-3.0, hosted or self-hosted.
                </p>

                <div className="mt-3.5 flex flex-wrap items-center gap-3">
                    <Button href={DOCS_URL} icon={<BookOpen size={13} />} variant="contrast">
                        Read the docs
                    </Button>

                    <Button href={REPO_URL} icon={<ArrowUpRight size={13} />}>
                        Browse the source
                    </Button>
                </div>
            </div>
        </div>
    );
}
