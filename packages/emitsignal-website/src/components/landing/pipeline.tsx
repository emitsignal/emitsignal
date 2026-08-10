import type { LucideIcon } from 'lucide-react';

import { Bell, Clock, Inbox, Radio, Terminal, Upload, Webhook } from 'lucide-react';

import { Reveal } from './reveal';
import { Section } from './section';

interface Node {
    detail: string;
    icon: LucideIcon;
    tag: string;
    title: string;
}

const SOURCES: Node[] = [
    {
        detail: 'POST a body from any shell, script, CI job, or Lambda.',
        icon: Upload,
        tag: 'POST /publish/<topic>',
        title: 'HTTP',
    },
    {
        detail: 'Reads stdin, so it pipes like any other unix tool.',
        icon: Terminal,
        tag: 'emitsignal publish',
        title: 'CLI',
    },
    {
        detail: 'Give GitHub or Stripe a URL, then template the payload.',
        icon: Webhook,
        tag: 'POST /h/:slug',
        title: 'Inbound webhooks',
    },
    {
        detail: 'Publish now, deliver later. Absolute or relative.',
        icon: Clock,
        tag: 'x-delay: 5m',
        title: 'Scheduled',
    },
];

const SINKS: Node[] = [
    {
        detail: 'Searchable history, with attachments and actions.',
        icon: Inbox,
        tag: 'web inbox',
        title: 'Your browser',
    },
    {
        detail: 'Native on iOS and Android, priority-aware.',
        icon: Bell,
        tag: 'push',
        title: 'Your phone',
    },
    {
        detail: 'Live SSE for the CLI, the TUI, and dashboards.',
        icon: Radio,
        tag: 'emitsignal listen',
        title: 'Your terminal',
    },
];

export function Pipeline() {
    return (
        <Section id="pipeline">
            <Reveal>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <h2 className="m-0 max-w-[15ch] text-[32px] font-medium leading-[1.05] tracking-[-0.03em] text-fg md:text-[44px]">
                        Whatever emits it. Wherever you read it.
                    </h2>

                    <p className="m-0 max-w-[46ch] text-[16px] leading-[1.6] text-muted md:text-right">
                        Four ways in, three ways out. In between it is one HTTP request and a topic
                        name. Nothing to provision.
                    </p>
                </div>

                <Diagram />
            </Reveal>
        </Section>
    );
}

function Diagram() {
    return (
        <div className="mt-12 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] lg:gap-0">
            <Stack nodes={SOURCES} />

            <Rail count={SOURCES.length} direction="in" />

            <Hub />

            <Rail count={SINKS.length} direction="out" />

            <Stack align="right" nodes={SINKS} />
        </div>
    );
}

function Hub() {
    return (
        <div className="mx-auto w-fit shrink-0 self-center rounded-2xl border border-accent/30 bg-elev px-5 py-4 shadow-[0_0_60px_-12px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]">
            <span className="font-mono text-[15px] font-semibold text-fg">EmitSignal</span>
        </div>
    );
}

function Rail({ count, direction }: { count: number; direction: 'in' | 'out' }) {
    const inbound = direction === 'in';
    const first = rowCenter(0, count);
    const last = rowCenter(count - 1, count);

    return (
        <div aria-hidden className="relative hidden w-16 lg:block">
            {Array.from({ length: count }, (_, index) => (
                <span
                    className="absolute h-px w-[calc(50%-0.5rem)] bg-line"
                    key={index}
                    style={{ [inbound ? 'left' : 'right']: '0.5rem', top: rowCenter(index, count) }}
                />
            ))}

            <span
                className="absolute w-px bg-line"
                style={{ height: `calc(${last} - ${first})`, left: '50%', top: first }}
            />

            <span
                className={`absolute top-1/2 h-px w-1/2 ${
                    inbound
                        ? 'left-1/2 bg-gradient-to-r from-line to-accent/70'
                        : 'left-0 bg-gradient-to-r from-accent/70 to-line'
                }`}
            />

            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
        </div>
    );
}

function rowCenter(index: number, total: number): string {
    return `${((index + 0.5) / total) * 100}%`;
}

function Stack({ align = 'left', nodes }: { align?: 'left' | 'right'; nodes: Node[] }) {
    return (
        <div className="flex h-full flex-col gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {nodes.map(({ detail, icon: Icon, tag, title }) => (
                <div
                    className={`flex flex-1 items-start gap-3.5 bg-elev px-5 py-4 ${
                        align === 'right' ? 'lg:flex-row-reverse lg:text-right' : ''
                    }`}
                    key={title}
                >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent/12">
                        <Icon className="text-accent" size={15} />
                    </span>

                    <div className="min-w-0 flex-1">
                        <p className="m-0 text-[14.5px] font-semibold leading-[1.3] text-fg">
                            {title}
                        </p>

                        <p className="m-0 mt-1 text-[13px] leading-[1.45] text-muted">{detail}</p>

                        <code className="mt-2 block truncate font-mono text-[11px] text-dim">
                            {tag}
                        </code>
                    </div>
                </div>
            ))}
        </div>
    );
}
