import { createFileRoute, Link } from '@tanstack/react-router';

import { Dot } from '#/components/ui/dot';
import { Footer } from '#/components/landing/footer';
import { Nav } from '#/components/landing/nav';

export const Route = createFileRoute('/dashboard')({ component: DashboardPage });

function Kicker({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[1.6px] text-accent">
            {children}
        </p>
    );
}

function H2({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="mb-3 mt-0 text-[26px] font-semibold tracking-[-0.6px] text-fg">
            {children}
        </h2>
    );
}

function P({ children }: { children: React.ReactNode }) {
    return <p className="mb-4 text-[14px] leading-[1.65] text-muted">{children}</p>;
}

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
    return (
        <section className="border-t border-line py-14" id={id}>
            {children}
        </section>
    );
}

function FeatureCard({
    desc,
    label,
    title,
}: {
    desc: string;
    label: string;
    title: string;
}) {
    return (
        <div className="rounded-xl border border-line bg-elev p-5">
            <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[1.4px] text-accent">
                {label}
            </p>
            <p className="mb-2 text-[16px] font-semibold tracking-[-0.3px] text-fg">{title}</p>
            <p className="m-0 text-[13px] leading-[1.55] text-muted">{desc}</p>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <Nav />

            {/* Hero */}
            <div className="px-5 pb-10 pt-16 sm:px-8 md:px-16 md:pt-20">
                <div className="mx-auto max-w-[1100px]">
                    <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                        Web Dashboard · emitsignal.com/app
                    </div>
                    <h1 className="m-0 mb-5 text-[52px] font-semibold leading-[1.0] tracking-[-1.8px] text-fg sm:text-[64px]">
                        Web Dashboard
                    </h1>
                    <p className="mb-10 max-w-[600px] text-[18px] leading-[1.6] text-muted">
                        Your signal inbox, channel manager, and publisher — all in one place. Works
                        alongside the CLI and mobile app. Changes sync instantly across all
                        surfaces.
                    </p>

                    {/* Mock dashboard */}
                    <div className="overflow-hidden rounded-2xl border border-line bg-deep shadow-[0_30px_80px_rgba(91,33,182,0.1)]">
                        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                            <span className="flex gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                            </span>
                            <span className="ml-3 font-mono text-[11px] text-dim">
                                emitsignal.com/app/inbox
                            </span>
                            <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-success">
                                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                live
                            </span>
                        </div>
                        <div className="flex h-[320px]">
                            {/* Sidebar */}
                            <div className="w-[180px] shrink-0 border-r border-line p-3 font-mono text-[11.5px]">
                                <div className="mb-3 px-2 text-[9px] uppercase tracking-widest text-faint">
                                    Workspace
                                </div>
                                <div className="rounded-md bg-accent/15 px-2.5 py-1.5 text-accent">
                                    ● Inbox <span className="ml-1 text-[10px] text-dim">7</span>
                                </div>
                                <div className="mt-1 px-2.5 py-1.5 text-muted">● Channels</div>
                                <div className="px-2.5 py-1.5 text-muted">● Publish</div>
                                <div className="px-2.5 py-1.5 text-muted">● API Keys</div>
                                <div className="mt-4 px-2 text-[9px] uppercase tracking-widest text-faint">
                                    Channels
                                </div>
                                {['alerts/prod', 'deploy/prod', 'cron/backup', 'ci/web', 'errors/web'].map((ch) => (
                                    <div className="mt-0.5 px-2.5 py-1 text-[11px] text-muted" key={ch}>
                                        {ch}
                                    </div>
                                ))}
                            </div>
                            {/* Inbox */}
                            <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                                    <span className="font-mono text-[11px] text-fg">Inbox</span>
                                    <span className="font-mono text-[10px] text-dim">7 unread · all time</span>
                                </div>
                                {[
                                    { ch: 'alerts/prod', msg: 'High memory on api-02 — mem.used > 92%', p: 5, t: '2m' },
                                    { ch: 'alerts/prod', msg: 'TLS cert expiring · cdn.acme.io · 7d', p: 5, t: '14m' },
                                    { ch: 'deploy/prod', msg: 'v2.14.3 shipped · api-gateway · 1m 42s', p: 4, t: '18m' },
                                    { ch: 'ci/web', msg: 'Build passed · feat/oauth-pkce · 247 tests', p: 3, t: '32m' },
                                    { ch: 'cron/backup', msg: 'nightly-backup.sh ✓ 14.2 GB → s3', p: 3, t: '3h' },
                                ].map((item, i) => (
                                    <div
                                        className={`flex items-start gap-3 border-b border-line px-4 py-3 ${i === 0 ? 'bg-elev' : ''}`}
                                        key={i}
                                    >
                                        <Dot level={item.p} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[10.5px] text-dim">{item.ch}</span>
                                                <span className="ml-auto font-mono text-[10px] text-faint">{item.t}</span>
                                            </div>
                                            <div className="mt-0.5 truncate text-[12.5px] text-fg">{item.msg}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 sm:px-8 md:px-16">
                <div className="mx-auto max-w-[1100px]">

                    {/* Overview */}
                    <Section id="overview">
                        <Kicker>Overview</Kicker>
                        <H2>Everything in one tab.</H2>
                        <P>
                            The web dashboard gives you a persistent inbox, channel management,
                            routing rule editor, and a publisher — all accessible from any browser
                            without installing anything.
                        </P>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                            <FeatureCard
                                desc="All your signals in one place, sorted by time and priority. Filter by channel, tag, or full-text search."
                                label="Core"
                                title="Signal inbox"
                            />
                            <FeatureCard
                                desc="Create channels, set topic prefixes, and attach routing rules that determine where each signal goes."
                                label="Core"
                                title="Channel manager"
                            />
                            <FeatureCard
                                desc="Send a signal from the browser. Useful for testing, manual alerts, and one-off notifications."
                                label="Core"
                                title="Publisher"
                            />
                            <FeatureCard
                                desc="Create and revoke API keys with granular scopes: publish-only, subscribe-only, or admin."
                                label="Settings"
                                title="API key management"
                            />
                            <FeatureCard
                                desc="Per-channel rules: priority filters, tag matchers, delivery window, batching, and per-destination overrides."
                                label="Routing"
                                title="Routing rules editor"
                            />
                            <FeatureCard
                                desc="90-day signal history. Search by topic, message content, priority, or tag. Download as CSV or JSON."
                                label="History"
                                title="Signal history"
                            />
                        </div>
                    </Section>

                    {/* Inbox */}
                    <Section id="inbox">
                        <Kicker>Inbox</Kicker>
                        <H2>Your signal feed.</H2>
                        <P>
                            The inbox streams signals in real time as they arrive. Signals are sorted
                            by time with priority indicators. Click any signal to expand the full
                            message, metadata, and delivery timeline.
                        </P>
                        <div className="grid gap-4 md:grid-cols-2">
                            {[
                                { title: 'Priority color coding', desc: 'p5 = red, p4 = amber, p3 = violet, p2/p1 = blue. Glanceable at 3am.' },
                                { title: 'Real-time streaming', desc: 'New signals appear instantly via SSE. No polling, no reload.' },
                                { title: 'Filter & search', desc: 'Filter by channel glob (alerts/*), priority expression (>=3), tag, or full text.' },
                                { title: 'Bulk dismiss', desc: 'Mark all as read, or dismiss all signals in a filtered view.' },
                                { title: 'Signal detail', desc: 'Expand any signal to see the full message, tags, metadata, and delivery log.' },
                                { title: 'Replay', desc: 'Re-deliver any signal to all current subscribers. Useful for testing routing changes.' },
                            ].map(({ desc, title }) => (
                                <div className="flex gap-3 rounded-xl border border-line bg-elev p-4" key={title}>
                                    <span className="mt-0.5 font-mono text-[13px] text-accent">→</span>
                                    <div>
                                        <p className="m-0 mb-1 text-[14px] font-semibold text-fg">{title}</p>
                                        <p className="m-0 text-[13px] leading-[1.5] text-muted">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Channels */}
                    <Section id="channels">
                        <Kicker>Channels</Kicker>
                        <H2>Organize topics into channels.</H2>
                        <P>
                            A channel is a named namespace with a topic prefix and a set of routing
                            rules. Everything published to <code className="font-mono text-[13px] text-accent">deploy/prod</code>{' '}
                            belongs to the <code className="font-mono text-[13px] text-accent">deploy</code> channel — which has
                            its own routing configuration.
                        </P>

                        <div className="overflow-hidden rounded-xl border border-line bg-deep font-mono text-[12px]">
                            <div className="border-b border-line px-4 py-2.5 text-dim">
                                Channel: deploy · prefix: deploy/
                            </div>
                            <div className="p-4">
                                <div className="mb-1 text-[10px] uppercase tracking-widest text-faint">
                                    Routing Rules
                                </div>
                                {[
                                    { match: 'priority:>=4', deliver: 'push + slack #deployments' },
                                    { match: 'priority:<=3', deliver: 'inbox only' },
                                    { match: 'tag:rollback', deliver: 'push + sms + slack', note: 'priority override: 5' },
                                    { match: 'hour:between(0,7)', deliver: 'inbox · batch digest at 08:00' },
                                ].map((rule) => (
                                    <div
                                        className="mt-2 flex flex-wrap gap-2 rounded-lg border border-line px-3 py-2"
                                        key={rule.match}
                                    >
                                        <span className="text-accent">{rule.match}</span>
                                        <span className="text-faint">→</span>
                                        <span className="text-muted">{rule.deliver}</span>
                                        {rule.note && (
                                            <span className="text-warn">· {rule.note}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {[
                                { title: 'Topic prefix matching', desc: 'Channels match any topic that starts with their prefix. One channel can cover hundreds of topics.' },
                                { title: 'Per-rule delivery targets', desc: 'Push, SMS, Slack, email, webhook — mix and match per rule. Each rule can target different destinations.' },
                                { title: 'Delivery windows', desc: 'Suppress delivery between 00:00–07:00 and batch into a morning digest. Works per-rule.' },
                                { title: 'Priority overrides', desc: 'A rollback tag can bump a p3 signal to p5 automatically. Rules can escalate or de-escalate priority.' },
                            ].map(({ desc, title }) => (
                                <div className="flex gap-3 rounded-xl border border-line bg-elev p-4" key={title}>
                                    <span className="mt-0.5 font-mono text-[13px] text-accent">→</span>
                                    <div>
                                        <p className="m-0 mb-1 text-[14px] font-semibold text-fg">{title}</p>
                                        <p className="m-0 text-[13px] leading-[1.5] text-muted">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Publisher */}
                    <Section id="publisher">
                        <Kicker>Publisher</Kicker>
                        <H2>Send signals from the browser.</H2>
                        <P>
                            The publisher is a form-based interface for sending signals manually.
                            Good for testing, debugging routing rules, or sending one-off
                            announcements to your team.
                        </P>
                        <div className="overflow-hidden rounded-xl border border-line bg-deep font-mono text-[12px]">
                            <div className="border-b border-line px-4 py-2.5 text-dim">Publish a signal</div>
                            <div className="p-4 space-y-3">
                                <div>
                                    <div className="mb-1 text-[10px] uppercase tracking-widest text-faint">Topic</div>
                                    <div className="rounded-lg border border-accent bg-elev px-3 py-2 text-fg">deploy/prod</div>
                                </div>
                                <div>
                                    <div className="mb-1 text-[10px] uppercase tracking-widest text-faint">Message</div>
                                    <div className="rounded-lg border border-line bg-elev px-3 py-2 text-muted">v2.14.3 shipped successfully · 1m 42s</div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <div className="mb-1 text-[10px] uppercase tracking-widest text-faint">Priority</div>
                                        <div className="rounded-lg border border-line bg-elev px-3 py-2 text-accent">4 — high</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-1 text-[10px] uppercase tracking-widest text-faint">Tags</div>
                                        <div className="rounded-lg border border-line bg-elev px-3 py-2 text-muted">deploy, production</div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-1">
                                    <div className="rounded-lg bg-accent px-5 py-2 text-bg">Publish →</div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* API Keys */}
                    <Section id="api-keys">
                        <Kicker>API Keys</Kicker>
                        <H2>Manage keys with scopes and topic restrictions.</H2>
                        <P>
                            Create a key per service — CI gets a publish-only key scoped to{' '}
                            <code className="font-mono text-[13px] text-accent">deploy/*</code> and{' '}
                            <code className="font-mono text-[13px] text-accent">ci/*</code>. The on-call rotation
                            gets a subscribe-only key. Admin keys stay with humans.
                        </P>

                        <div className="overflow-hidden rounded-xl border border-line">
                            <div className="border-b border-line px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[1.4px] text-dim">
                                API Keys
                            </div>
                            {[
                                { label: 'ci-prod', scope: 'publish', topics: 'deploy/*, ci/*', created: '2026-01-15', last: '2m ago' },
                                { label: 'monitoring', scope: 'publish', topics: 'alerts/*, errors/*', created: '2026-02-01', last: '14m ago' },
                                { label: 'oncall-reader', scope: 'subscribe', topics: '*', created: '2026-03-10', last: '1h ago' },
                                { label: 'admin', scope: 'admin', topics: '*', created: '2025-12-01', last: '2d ago' },
                            ].map((key) => (
                                <div
                                    className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-0 font-mono text-[12px]"
                                    key={key.label}
                                >
                                    <span className="w-32 text-fg">{key.label}</span>
                                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${key.scope === 'admin' ? 'bg-danger/15 text-danger' : key.scope === 'publish' ? 'bg-accent/15 text-accent' : 'bg-success/15 text-success'}`}>
                                        {key.scope}
                                    </span>
                                    <span className="flex-1 text-dim">{key.topics}</span>
                                    <span className="text-faint">{key.last}</span>
                                    <span className="cursor-pointer text-danger">revoke</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* History */}
                    <Section id="history">
                        <Kicker>Signal History</Kicker>
                        <H2>90-day searchable history.</H2>
                        <P>
                            Every signal is stored for 90 days (Team plan). Search by topic, message
                            content, priority, tag, or publisher. Export any filtered view as CSV or
                            JSON for post-mortems or audits.
                        </P>
                        <div className="grid gap-4 md:grid-cols-2">
                            {[
                                { title: 'Full-text search', desc: 'Search message content, titles, and metadata. Results sorted by relevance or time.' },
                                { title: 'Advanced filters', desc: 'Combine topic glob, priority range, tag, date range, publisher, and read status.' },
                                { title: 'Export', desc: 'Download filtered results as JSON (with metadata) or CSV (for spreadsheets).' },
                                { title: 'Retention', desc: 'Free: 7 days · Team: 90 days · Enterprise: configurable (up to 3 years).' },
                            ].map(({ desc, title }) => (
                                <div className="flex gap-3 rounded-xl border border-line bg-elev p-4" key={title}>
                                    <span className="mt-0.5 font-mono text-[13px] text-accent">→</span>
                                    <div>
                                        <p className="m-0 mb-1 text-[14px] font-semibold text-fg">{title}</p>
                                        <p className="m-0 text-[13px] leading-[1.5] text-muted">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <div className="border-t border-line py-12 text-center">
                        <p className="mb-4 text-[14px] text-muted">
                            See it for yourself — the dashboard is free to use.
                        </p>
                        <Link
                            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-mono text-[13px] font-semibold text-bg no-underline hover:bg-accent-dim"
                            to="/app"
                        >
                            Open dashboard →
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
