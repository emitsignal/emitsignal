import { createFileRoute } from '@tanstack/react-router';

import { Footer } from '#/components/landing/footer';
import { Nav } from '#/components/landing/nav';

export const Route = createFileRoute('/changelog')({ component: ChangelogPage });

interface ChangeEntry {
    added?: string[];
    date: string;
    fixed?: string[];
    improved?: string[];
    note?: string;
    version: string;
}

const RELEASES: ChangeEntry[] = [
    {
        added: [
            'GDPR/LGPD privacy policy and terms-of-service pages',
            'Account deletion with cascading data erasure, plus DELETE /me/signals purge (async purge queue + worker)',
            'Apple and GitHub social sign-in',
            'Email allowlist for OTP sign-in and cross-subdomain cookie support',
            'Separate public/private S3 buckets and database backup/restore to Cloudflare R2',
            'Topic-name validation (length + format) across server, web, and mobile',
            'Anonymous-subscription claiming on sign-in',
            'Webhook template engine with wildcard array iteration',
        ],
        date: '2026-06-26',
        fixed: [
            'Publishing now requires at least a title or body',
            'Hanging loading states on Inbox and Channels',
            'Theme-aware webhook JSON viewer',
        ],
        improved: [
            'Stopped collecting and storing session IP addresses',
            'OTP send/verify rate limiting',
            'Replaced the hand-rolled Expo push client with the official expo-server-sdk',
        ],
        note: 'First stable release — privacy-compliant by default, with full data-erasure support.',
        version: '1.0.0',
    },
    {
        added: [
            'Light/dark theme on mobile (render-time palette + useThemedStyles) and the web dashboard',
            'Native mobile UI on Expo SDK 56 — native bottom tabs, @expo/ui Switch, segmented control, and action menus',
            'Animated splash screen',
            'Inline media and banner images on publish, with image gallery and external-link warning',
            'Per-subscription settings (delivery + listenSince) and topic-scoped history',
            'Feed styles (comfy / timeline / priority-first) with persisted preferences',
        ],
        date: '2026-06-20',
        improved: [
            'Database indexes and DB-aggregated topic metrics',
            'Webhook delivery N+1 queries collapsed into grouped lookups',
            'Expo push requests batched in chunks of 100',
            'Email notification when a new API key is created',
        ],
        version: '0.9.0',
    },
    {
        added: [
            'Stripe subscription billing via Better Auth — Free, Pulse, and Beam plans',
            'Plan-based daily quotas (messages, emails) and per-plan limits (topics, webhooks, attachment size)',
            'GET /billing endpoint and billing settings page',
            'API-key authentication from request headers (x-api-key / Bearer)',
        ],
        date: '2026-06-14',
        improved: [
            'TanStack Query across web and mobile with live SSE cache updates',
            'Current-plan badge in the sidebar and settings',
        ],
        version: '0.8.0',
    },
    {
        added: [
            'Better Auth — email OTP, passkeys, API keys, and bearer sessions',
            'Avatar upload/remove (2 MB, deterministic storage path)',
            'User-scoped subscriptions that follow your account, not just a device',
            'API-key management UI — create, revoke, roll',
            'First-sign-in onboarding with avatar and topic suggestions',
        ],
        date: '2026-06-09',
        fixed: ['OTP encoded in the verification URL; verification flow hardened'],
        improved: ['Issued API-key prefix shortened to es_'],
        note: 'Authentication re-platformed onto Better Auth — adds passkeys and a unified session model.',
        version: '0.7.0',
    },
    {
        added: [
            'Webhooks — CRUD endpoints, inbound receiver (/h/:slug), and delivery history',
            '@emitsignal/shared package (typed API client + helpers)',
            'Header-based publishing (title, x-priority, x-tags, x-delay) for non-JSON publishers',
            'Topic metrics endpoint (24h message volume) and dashboard stats',
            'Settings section with profile / account / billing / advanced sub-nav',
        ],
        date: '2026-06-05',
        improved: [
            'Per-endpoint rate limiting (anonymous vs authenticated) with composable factories',
            'SSE concurrency via slot acquisition and heartbeat-frame filtering',
            'OpenTelemetry + Jaeger tracing and Sentry error tracking',
            'LRU cache for topic-name lookups',
        ],
        version: '0.6.0',
    },
    {
        added: [
            'Web app on TanStack Start — landing page, dashboard, inbox, channels, publish, and API keys',
            'Magic-link auth pages and route guards on the web',
            'Topic suggestions in subscription and onboarding flows',
            'Dynamic feed filters with persisted unread state',
            'Image preview modal with zoom and share (mobile)',
            'Design-system specification',
        ],
        date: '2026-05-27',
        improved: [
            'Responsive website layout',
            'PostgreSQL + Docker for development and production',
        ],
        note: 'Database migrated from SQLite to PostgreSQL; full Docker dev/prod stack (Traefik) added.',
        version: '0.5.0',
    },
    {
        added: [
            'Push notifications via a BullMQ push queue/worker (iOS / Android / Web)',
            'Scheduled message delivery (x-delay: unix timestamp or relative like 5m, 2h)',
            'Message actions — interactive buttons (acknowledge / view) threaded through publish → SSE → push',
            'File attachments with a storage abstraction (local or S3) and mobile previews',
            'GET /messages/:id direct fetch',
            'Per-device delivery toggles',
        ],
        date: '2026-05-21',
        fixed: ['Push notification title formatting'],
        improved: [
            'Deep-link push taps open the message detail',
            'HTTP route and unit tests for the Elysia API',
        ],
        note: 'Session tokens migrated to JWT.',
        version: '0.4.0',
    },
    {
        added: [
            '@emitsignal/emails package with React Email templates (welcome, magic link, message alerts, weekly digest, API-key created)',
            'BullMQ + Redis queue-based email delivery',
            'Magic-link emails wired end-to-end',
        ],
        date: '2026-05-15',
        fixed: [
            'Auth token parsing and OTP code verification',
            'Branding standardized to "EmitSignal"',
        ],
        improved: ['Structured logging with pino', 'READMEs rewritten with accurate architecture'],
        version: '0.3.0',
    },
    {
        added: [
            'New API server on Elysia + Bun with a Prisma data layer',
            'Server-Sent Events real-time delivery (GET /topics/:name/listen)',
            'Magic-link / email authentication',
            'Mobile API client, SSE hook, session context, and full auth flow (sign-in, verify, permissions)',
            'Channels, publish, and message-detail screens on mobile',
            'OpenAPI documentation via @elysia/openapi',
            'Onboarding flow with persistent completion state',
        ],
        date: '2026-05-03',
        improved: [
            'Monorepo restructure into packages/; ESLint + Prettier with perfectionist sorting',
        ],
        note: 'Backend re-platformed from Convex to Prisma + Elysia; real-time delivery now runs over SSE.',
        version: '0.2.0',
    },
    {
        added: [
            'Topic-based pub/sub — create a topic, subscribe, receive messages',
            'iOS and Android mobile app (Expo) with subscribe modal and message view',
            'Theme settings and topic-subscriber screens',
        ],
        date: '2026-02-15',
        note: 'Private beta on a Convex backend — the foundation the platform was later rebuilt on.',
        version: '0.1.0',
    },
];

export default function ChangelogPage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <Nav />

            {/* Hero */}
            <div className="px-5 pb-10 pt-16 sm:px-8 md:px-16 md:pt-20">
                <div className="mx-auto max-w-[760px]">
                    <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_var(--color-success)]" />
                        Latest: v1.0.0 · 2026-06-26
                    </div>
                    <h1 className="m-0 mb-5 text-[52px] font-semibold leading-[1.0] tracking-[-1.8px] text-fg sm:text-[64px]">
                        Changelog
                    </h1>
                    <p className="mb-2 text-[18px] leading-[1.6] text-muted">
                        Every release, every change. From private beta to general availability.
                    </p>
                    <p className="font-mono text-[12px] text-dim">
                        Subscribe to updates:{' '}
                        <a className="text-accent no-underline" href="#">
                            RSS →
                        </a>{' '}
                        ·{' '}
                        <a className="text-accent no-underline" href="#">
                            email digest →
                        </a>
                    </p>
                </div>
            </div>

            {/* Coming next */}
            <div className="px-5 pb-4 sm:px-8 md:px-16">
                <div className="mx-auto max-w-[760px]">
                    <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/[0.04] px-5 py-4">
                        <div className="mb-3 flex flex-wrap items-baseline gap-3">
                            <span className="rounded px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[1.2px] text-accent">
                                Coming next
                            </span>
                            <span className="font-mono text-[12px] text-dim">targeting v1.1.0</span>
                        </div>
                        <ul className="m-0 list-none space-y-2 p-0">
                            <li className="flex items-start gap-2.5 text-[13.5px] leading-[1.55] text-muted">
                                <span className="mt-0.5 font-mono text-[12px] text-accent">→</span>
                                <span>
                                    <span className="text-fg">emitsignal CLI</span> — publish,
                                    listen, and subscribe from the terminal{' '}
                                    <a className="text-accent no-underline" href="/cli">
                                        (docs preview)
                                    </a>
                                </span>
                            </li>
                            <li className="flex items-start gap-2.5 text-[13.5px] leading-[1.55] text-muted">
                                <span className="mt-0.5 font-mono text-[12px] text-accent">→</span>
                                <span>
                                    <span className="text-fg">Terminal UI (TUI)</span> — full-screen
                                    inbox
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="px-5 pb-20 sm:px-8 md:px-16">
                <div className="mx-auto max-w-[760px]">
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[7px] top-0 bottom-0 w-px bg-line" />

                        <div className="space-y-14">
                            {RELEASES.map((release) => (
                                <div className="relative pl-8" key={release.version}>
                                    {/* Dot */}
                                    <div className="absolute left-0 top-[5px] h-3.5 w-3.5 rounded-full border-2 border-accent bg-bg shadow-[0_0_8px_var(--color-accent)]" />

                                    {/* Header */}
                                    <div className="mb-4 flex flex-wrap items-baseline gap-3">
                                        <span className="font-mono text-[22px] font-semibold tracking-[-0.5px] text-fg">
                                            v{release.version}
                                        </span>
                                        <span className="font-mono text-[12px] text-dim">
                                            {release.date}
                                        </span>
                                    </div>

                                    {release.note && (
                                        <div className="mb-4 rounded-xl border border-warn/35 bg-warn/5 px-4 py-3 font-mono text-[12px] text-warn">
                                            ⚠ {release.note}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {release.added && (
                                            <div>
                                                <div className="mb-2">
                                                    <Tag type="added" />
                                                </div>
                                                <ul className="m-0 list-none space-y-2 p-0">
                                                    {release.added.map((item) => (
                                                        <li
                                                            className="flex items-start gap-2.5 text-[13.5px] leading-[1.55] text-muted"
                                                            key={item}
                                                        >
                                                            <span className="mt-0.5 font-mono text-[12px] text-success">
                                                                +
                                                            </span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {release.improved && (
                                            <div>
                                                <div className="mb-2">
                                                    <Tag type="improved" />
                                                </div>
                                                <ul className="m-0 list-none space-y-2 p-0">
                                                    {release.improved.map((item) => (
                                                        <li
                                                            className="flex items-start gap-2.5 text-[13.5px] leading-[1.55] text-muted"
                                                            key={item}
                                                        >
                                                            <span className="mt-0.5 font-mono text-[12px] text-accent">
                                                                ↑
                                                            </span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {release.fixed && (
                                            <div>
                                                <div className="mb-2">
                                                    <Tag type="fixed" />
                                                </div>
                                                <ul className="m-0 list-none space-y-2 p-0">
                                                    {release.fixed.map((item) => (
                                                        <li
                                                            className="flex items-start gap-2.5 text-[13.5px] leading-[1.55] text-muted"
                                                            key={item}
                                                        >
                                                            <span className="mt-0.5 font-mono text-[12px] text-danger">
                                                                ✕
                                                            </span>
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

function Tag({ type }: { type: 'added' | 'fixed' | 'improved' }) {
    const styles = {
        added: 'bg-success/15 text-success',
        fixed: 'bg-danger/15 text-danger',
        improved: 'bg-accent/15 text-accent',
    };
    return (
        <span
            className={`rounded px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[1.2px] ${styles[type]}`}
        >
            {type}
        </span>
    );
}
