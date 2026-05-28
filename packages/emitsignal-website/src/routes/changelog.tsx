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
            'Webhook delivery receipts — see exactly when each webhook fired and its HTTP response',
            'Signal replay from the web dashboard and mobile app',
            'idempotency_key field on publish — deduplicates within a 24h window',
            'emitsignal doctor command — prints connectivity diagnostics and API health',
        ],
        date: '2026-05-20',
        fixed: [
            'SSE reconnect could drop the first signal after coming back online',
            'TUI: long messages truncated incorrectly on narrow terminals',
            'API key created_at field was returning UTC offset incorrectly in some regions',
        ],
        improved: [
            'p99 end-to-end latency reduced from 420ms to 290ms',
            'Mobile app: feed now renders from cache before the live fetch completes',
            'Routing rule evaluation is now 3× faster for channels with >20 rules',
        ],
        version: '0.7.2',
    },
    {
        added: [
            'Delivery windows in routing rules — suppress delivery during quiet hours and batch into a digest',
            'emitsignal run --only-failures flag — publish only on non-zero exit',
            'Topics API: GET /topics/:topic/signals for paginated signal history per topic',
            'Signal metadata field (meta) — arbitrary JSON stored with each signal',
        ],
        date: '2026-04-30',
        fixed: [
            'emitsignal listen --count 1 could hang if the connection was interrupted',
            'Dashboard: filtering by tag with special characters broke the query',
            'Mobile: badge count was off by one after dismissing the last signal',
        ],
        improved: [
            'emitsignal tui now supports vim keybindings (j/k navigation)',
            'CLI --format json now includes all metadata fields',
            'API error responses include a machine-readable code field',
        ],
        version: '0.7.1',
    },
    {
        added: [
            'Routing rules engine — per-channel rules with priority filters, tag matchers, and delivery targets',
            'Batch digest delivery — accumulate signals during quiet hours and deliver as one summary',
            'Priority override in routing rules — a rollback tag can auto-escalate to p5',
            'emitsignal history command — print last N signals without opening the TUI',
            'Windows support — binary available for x86_64 and arm64',
        ],
        date: '2026-04-10',
        fixed: [
            'Publishing with --wait timed out even on successful delivery in high-latency regions',
            'Channel create from the CLI did not apply the default routing rules',
            'TUI: pressing d on an empty inbox caused a panic',
        ],
        improved: [
            'SSE connections now use HTTP/2 multiplexing, reducing per-connection overhead',
            'Mobile app: push notification grouping by channel (iOS 15+ Notification Summary)',
            'Web dashboard loads 40% faster — route data prefetched on hover',
        ],
        note: 'This release introduces breaking changes to the routing rules config format. See the migration guide.',
        version: '0.7.0',
    },
    {
        added: [
            'emitsignal run command — wrap any shell command and signal its outcome',
            'Tag filtering in listen and subscribe — --tag flag supports multiple values',
            'Web dashboard: bulk dismiss — mark all as read, or dismiss entire filtered views',
            'Mobile: share sheet integration — share any text from any app as a signal',
        ],
        date: '2026-03-18',
        fixed: [
            'Glob patterns with multiple wildcards (alerts/**) were not matching correctly',
            'Mobile: DND bypass for p5 signals did not work on Android 13',
            'emitsignal login --token was silently failing if the token had extra whitespace',
        ],
        improved: [
            'API key scopes: topic-level restrictions now supported (restrict key to deploy/*, ci/*)',
            'TUI: signal detail view now shows the full delivery timeline with timestamps',
            'CLI install script now detects ARM vs x86 automatically on all platforms',
        ],
        version: '0.6.3',
    },
    {
        added: [
            'Signal search in web dashboard — full-text search across message, title, and metadata',
            'CSV and JSON export for filtered signal history',
            'emitsignal config command — read/write CLI config from the terminal',
            'Webhook signature verification with HMAC-SHA256',
        ],
        date: '2026-03-01',
        fixed: [
            'Race condition in SSE reconnect could result in duplicate signals appearing',
            'Web dashboard: routing rule editor did not save changes on Safari',
            'emitsignal whoami was not printing workspace when using a token-scoped key',
        ],
        improved: [
            'Mobile: offline queue now retries failed publishes with exponential backoff',
            'API rate limit headers added to all responses (X-RateLimit-*)',
            'TUI startup is now instant — config loaded lazily',
        ],
        version: '0.6.2',
    },
    {
        added: [
            'TUI (Terminal UI) — full-screen inbox with j/k navigation, filter, and publish',
            'emitsignal subscribe alias for emitsignal listen',
            'Anonymous device mode — use the CLI and mobile app without an account',
            'GET /signals endpoint with full filter support (topic, priority, tag, date)',
        ],
        date: '2026-02-14',
        fixed: [
            'emitsignal publish could silently drop messages larger than 8KB',
            'Mobile: channels list did not refresh after subscribing from another device',
            'Web dashboard: sign-in redirect loop on Safari private browsing',
        ],
        improved: [
            'TUI renders at 60fps using a custom diff engine (no more flickering)',
            'API response times improved across all endpoints (p50: 18ms, p99: 95ms)',
            'Documentation fully rewritten with examples for every endpoint',
        ],
        version: '0.6.0',
    },
    {
        added: [
            'Channels — named namespaces with topic prefixes',
            'API key management — create, list, revoke with scopes',
            'Web dashboard: publisher with topic autocomplete',
            'Signal priority levels 1–5 with color-coded display',
            'Replay signal — re-deliver to all current subscribers',
        ],
        date: '2026-01-20',
        fixed: [
            'Initial release cleanup — auth redirect edge cases resolved',
            'emitsignal listen was not filtering by topic correctly when using a glob',
        ],
        improved: [
            'Magic link auth flow is now faster — OTP auto-fills from the link in the email',
            'Mobile feed performance improved on low-end Android devices',
        ],
        version: '0.5.0',
    },
    {
        added: [
            'Initial public release',
            'emitsignal publish and listen commands',
            'Magic link authentication',
            'iOS and Android mobile apps',
            'Web dashboard with inbox and publish',
            'SSE-based real-time signal delivery',
            'REST API: publish, subscribe, topics',
        ],
        date: '2026-01-01',
        note: 'v0.1 was a private beta. v0.4 is the first public release.',
        version: '0.4.0',
    },
];

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

export default function ChangelogPage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <Nav />

            {/* Hero */}
            <div className="px-5 pb-10 pt-16 sm:px-8 md:px-16 md:pt-20">
                <div className="mx-auto max-w-[760px]">
                    <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_var(--color-success)]" />
                        Latest: v0.7.2 · 2026-05-20
                    </div>
                    <h1 className="m-0 mb-5 text-[52px] font-semibold leading-[1.0] tracking-[-1.8px] text-fg sm:text-[64px]">
                        Changelog
                    </h1>
                    <p className="mb-2 text-[18px] leading-[1.6] text-muted">
                        Every release, every change. We ship every two weeks.
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
