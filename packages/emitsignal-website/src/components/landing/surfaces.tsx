import type { ReactNode } from 'react';

import { Bell, GitBranch, Globe, type LucideIcon, Terminal } from 'lucide-react';

import { Dot } from '#/components/ui/dot';
import { Logo } from '#/components/ui/logo';

import { Eyebrow } from './eyebrow';
import { Section } from './section';

interface SurfaceCardProps {
    children: ReactNode;
    desc: string;
    icon: LucideIcon;
    label: string;
    span: number;
}

export function Surfaces() {
    return (
        <Section id="surfaces">
            <Eyebrow>SURFACES</Eyebrow>
            <h2 className="m-0 mb-4 max-w-[820px] text-[44px] font-semibold leading-[1.05] tracking-[-1.4px] text-fg">
                Read & write from wherever you already work.
            </h2>
            <p className="mb-10 max-w-[620px] font-sans text-[17px] leading-[1.55] text-muted">
                Same brand, same routing, every surface. Pick one or use all five — they sync.
            </p>

            <div className="grid grid-cols-12 gap-[18px]">
                <SurfaceCard
                    desc="Listen, publish, tui."
                    icon={Terminal}
                    label="CLI · emitsignal"
                    span={7}
                >
                    <CLIPreview />
                </SurfaceCard>
                <SurfaceCard
                    desc="Inbox · push · priorities."
                    icon={Bell}
                    label="Mobile · iOS/Android"
                    span={5}
                >
                    <MobilePreview />
                </SurfaceCard>
                <SurfaceCard
                    desc="Inbox, channels, routing."
                    icon={Globe}
                    label="Web · dashboard"
                    span={5}
                >
                    <WebPreview />
                </SurfaceCard>
                <SurfaceCard
                    desc="14 sources, 9 sinks. Pipe between them."
                    icon={GitBranch}
                    label="Integrations · plug-and-play"
                    span={7}
                >
                    <IntegrationsPreview />
                </SurfaceCard>
            </div>
        </Section>
    );
}

const SPAN_CLASS: Record<number, string> = {
    5: 'col-span-5',
    7: 'col-span-7',
};

interface MobileItem {
    ch: string;
    m: string;
    p: number;
    t: string;
    tm: string;
}

function CLIPreview() {
    return (
        <div className="mt-4.5 rounded-xl bg-deep px-4 py-3.5 font-mono text-[12.5px] leading-[1.7] text-fg">
            <div>
                <span className="text-success">$</span> wsp listen 'priority&gt;=4 AND tag:prod'
            </div>
            <div className="mt-0.5 text-dim">→ connected · 4 channels match · ws</div>
            <div className="mt-1.5">
                <span className="text-faint">21:52:14</span> <span className="text-danger">●</span>{' '}
                alerts/prod p5 High memory on api-02
            </div>
            <div>
                <span className="text-faint">21:52:01</span> <span className="text-accent">●</span>{' '}
                deploy/prod p4 v2.14.3 shipped
            </div>
            <div>
                <span className="text-faint">21:48:02</span> <span className="text-warn">●</span>{' '}
                cron/backup p3 ✓ 14.2 GB → s3
            </div>
            <div className="mt-2 text-accent">
                ${' '}
                <span
                    className="ml-0.5 inline-block h-3 w-[7px] bg-accent align-middle"
                    style={{ animation: 'signal-caret 1s steps(2) infinite' }}
                />
            </div>
        </div>
    );
}

function SurfaceCard({ children, desc, icon: Icon, label, span }: SurfaceCardProps) {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-line bg-elev p-7 ${SPAN_CLASS[span]}`}
        >
            <div>
                <div className="inline-flex items-center gap-2.5 rounded-full border border-accent/35 px-[11px] py-[5px] font-mono text-[11px] font-semibold text-accent">
                    <Icon size={11} />
                    {label}
                </div>
                <p className="mt-3.5 m-0 text-[22px] font-semibold tracking-[-0.4px]">{desc}</p>
            </div>
            {children}
        </div>
    );
}
const MOBILE_ITEMS: MobileItem[] = [
    { ch: 'alerts/prod', m: 'mem.used > 92%', p: 5, t: 'High memory on api-02', tm: '2m' },
    { ch: 'deploy/prod', m: 'api-gateway · 1m 42s', p: 4, t: 'v2.14.3 shipped', tm: '4m' },
    { ch: 'ci/web', m: '247 tests green', p: 3, t: 'Build passed', tm: '12m' },
];

interface IntegrationCard {
    color: string;
    name: string;
}

function MobilePreview() {
    return (
        <div className="mt-4.5 rounded-xl border border-line bg-deep p-3.5">
            {MOBILE_ITEMS.map((n, i) => (
                <div
                    className={`flex gap-2.5 py-2 ${i < MOBILE_ITEMS.length - 1 ? 'border-b border-line' : ''}`}
                    key={i}
                >
                    <Dot level={n.p} />
                    <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2">
                            <span className="font-mono text-[10.5px] text-dim">{n.ch}</span>
                            <span className="font-mono text-[10px] text-faint">{n.tm}</span>
                        </div>
                        <div className="mt-0.5 text-[13px] font-semibold text-fg">{n.t}</div>
                        <div className="text-[11.5px] text-muted">{n.m}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function WebPreview() {
    return (
        <div className="mt-4.5 overflow-hidden rounded-xl border border-line bg-deep">
            <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-2.5">
                <Logo size={11} />
                <span className="ml-auto font-mono text-[10px] text-dim">7 unread</span>
            </div>
            <div className="flex h-[140px]">
                <div className="w-[100px] border-r border-line px-2.5 py-2 font-mono text-[10.5px]">
                    <div className="py-0.5 text-accent">● Inbox</div>
                    <div className="py-0.5 text-muted">● Channels</div>
                    <div className="py-0.5 text-muted">● Publish</div>
                    <div className="py-0.5 text-muted">● Keys</div>
                </div>
                <div className="flex-1 p-2.5">
                    {[5, 4, 3, 2].map((p) => (
                        <div
                            className="flex gap-2 py-0.5 font-mono text-[10.5px] text-muted"
                            key={p}
                        >
                            <Dot level={p} size={5} />
                            <span>alerts/prod</span>
                            <span className="min-w-0 flex-1 truncate text-fg">p{p} event</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
const INTEGRATIONS: IntegrationCard[] = [
    { color: '#fff', name: 'GitHub' },
    { color: '#a78bfa', name: 'Sentry' },
    { color: '#67e8f9', name: 'Stripe' },
    { color: '#f0abfc', name: 'Vercel' },
    { color: '#fbbf24', name: 'Datadog' },
    { color: '#a78bfa', name: 'Linear' },
    { color: '#4ade80', name: 'PagerDuty' },
    { color: '#a78bfa', name: 'Slack' },
];

function IntegrationsPreview() {
    return (
        <div className="mt-4.5 grid grid-cols-4 gap-2.5">
            {INTEGRATIONS.map((it) => (
                <div
                    className="flex items-center gap-2.5 rounded-lg border border-line bg-deep p-2.5"
                    key={it.name}
                >
                    <div
                        className="flex h-[22px] w-[22px] items-center justify-center rounded-md font-mono text-[12px] font-bold"
                        style={{ background: `${it.color}22`, color: it.color }}
                    >
                        {it.name[0]}
                    </div>
                    <span className="text-[12.5px]">{it.name}</span>
                </div>
            ))}
        </div>
    );
}
