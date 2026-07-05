import { createFileRoute, Link } from '@tanstack/react-router';

import { Footer } from '#/components/landing/footer';
import { Nav } from '#/components/landing/nav';
import { Dot } from '#/components/ui/dot';

export const Route = createFileRoute('/mobile')({ component: MobilePage });

export default function MobilePage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <Nav />

            {/* Hero */}
            <div className="px-5 pb-10 pt-16 sm:px-8 md:px-16 md:pt-20">
                <div className="mx-auto max-w-[1100px]">
                    <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                        <div>
                            <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                                iOS · Android · free
                            </div>
                            <h1 className="m-0 mb-5 text-[52px] font-semibold leading-[1.0] tracking-[-1.8px] text-fg sm:text-[60px]">
                                Mobile Apps
                            </h1>
                            <p className="mb-7 text-[18px] leading-[1.6] text-muted">
                                Get push notifications the instant a signal is published. Read your
                                inbox, manage channels, and publish signals from anywhere — all from
                                your phone.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <a
                                    className="flex items-center gap-2.5 rounded-xl border border-line bg-elev px-4 py-3 no-underline hover:bg-elev-2"
                                    href="#"
                                >
                                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-fg font-mono text-[11px] text-bg font-bold">
                                        A
                                    </div>
                                    <div>
                                        <div className="font-mono text-[9px] uppercase tracking-widest text-dim">
                                            App Store
                                        </div>
                                        <div className="font-mono text-[13px] font-semibold text-fg">
                                            iOS &amp; iPadOS
                                        </div>
                                    </div>
                                </a>
                                <a
                                    className="flex items-center gap-2.5 rounded-xl border border-line bg-elev px-4 py-3 no-underline hover:bg-elev-2"
                                    href="#"
                                >
                                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-success font-mono text-[11px] text-bg font-bold">
                                        G
                                    </div>
                                    <div>
                                        <div className="font-mono text-[9px] uppercase tracking-widest text-dim">
                                            Google Play
                                        </div>
                                        <div className="font-mono text-[13px] font-semibold text-fg">
                                            Android
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Phone mockup */}
                        <div className="flex justify-center md:justify-end">
                            <div className="w-[260px]">
                                <PhoneFrame title="EmitSignal · Feed">
                                    <div className="px-3 py-3">
                                        {[
                                            {
                                                ch: 'alerts/prod',
                                                msg: 'High memory on api-02',
                                                p: 5,
                                                t: '2m',
                                            },
                                            {
                                                ch: 'deploy/prod',
                                                msg: 'v2.14.3 shipped successfully',
                                                p: 4,
                                                t: '18m',
                                            },
                                            {
                                                ch: 'cron/backup',
                                                msg: 'nightly-backup.sh ✓ 14.2 GB',
                                                p: 3,
                                                t: '3h',
                                            },
                                            {
                                                ch: 'ci/web',
                                                msg: 'Build passed · 247 tests green',
                                                p: 3,
                                                t: '3h',
                                            },
                                            {
                                                ch: 'github/acme',
                                                msg: 'PR #482 reviewed · approved',
                                                p: 2,
                                                t: '5h',
                                            },
                                        ].map((item, i) => (
                                            <div
                                                className="flex items-start gap-2.5 border-b border-line py-2.5 last:border-0"
                                                key={i}
                                            >
                                                <Dot level={item.p} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono text-[9.5px] text-dim">
                                                            {item.ch}
                                                        </span>
                                                        <span className="font-mono text-[9px] text-faint">
                                                            {item.t}
                                                        </span>
                                                    </div>
                                                    <div className="mt-0.5 truncate text-[11.5px] font-semibold text-fg">
                                                        {item.msg}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-around border-t border-line px-4 py-2.5 font-mono text-[9px] text-muted">
                                        <span className="text-accent">Feed</span>
                                        <span>Channels</span>
                                        <span>Publish</span>
                                        <span>Settings</span>
                                    </div>
                                </PhoneFrame>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 sm:px-8 md:px-16">
                <div className="mx-auto max-w-[1100px]">
                    {/* Features */}
                    <Section id="features">
                        <Kicker>Features</Kicker>
                        <H2>Built for the way developers work.</H2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Feed */}
                            <div className="rounded-2xl border border-line bg-elev p-6">
                                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[1.4px] text-accent">
                                    Feed
                                </p>
                                <p className="mb-2 text-[18px] font-semibold tracking-[-0.3px] text-fg">
                                    Real-time signal inbox
                                </p>
                                <p className="mb-4 text-[13px] leading-[1.6] text-muted">
                                    Signals arrive in your feed the moment they're published — no
                                    pull-to-refresh, no delay. Priority color coding makes it
                                    immediately obvious what needs your attention.
                                </p>
                                <ul className="m-0 list-none p-0 space-y-2">
                                    {[
                                        'Live SSE connection — signals appear instantly',
                                        'Priority color coding: p5 red → p1 blue',
                                        'Swipe to dismiss or long-press to replay',
                                        'Offline queue — catches up when reconnected',
                                        'Filter by channel, priority, or tag',
                                    ].map((item) => (
                                        <li
                                            className="flex items-start gap-2 text-[12.5px] text-muted"
                                            key={item}
                                        >
                                            <span className="mt-0.5 text-accent font-mono">→</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Push */}
                            <div className="rounded-2xl border border-line bg-elev p-6">
                                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[1.4px] text-accent">
                                    Push Notifications
                                </p>
                                <p className="mb-2 text-[18px] font-semibold tracking-[-0.3px] text-fg">
                                    Wake up for what matters
                                </p>
                                <p className="mb-4 text-[13px] leading-[1.6] text-muted">
                                    Push notifications are routed through your channel rules. A
                                    priority-5 signal can wake you up at 3am. A priority-1 debug
                                    signal silently lands in the inbox.
                                </p>
                                <ul className="m-0 list-none p-0 space-y-2">
                                    {[
                                        'Per-channel push notification rules',
                                        'Critical alerts (p5) bypass Do Not Disturb',
                                        'Grouped notifications by channel',
                                        'Tap to deep-link directly to the signal',
                                        'Delivery receipt — see when it landed',
                                    ].map((item) => (
                                        <li
                                            className="flex items-start gap-2 text-[12.5px] text-muted"
                                            key={item}
                                        >
                                            <span className="mt-0.5 text-accent font-mono">→</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Channels */}
                            <div className="rounded-2xl border border-line bg-elev p-6">
                                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[1.4px] text-accent">
                                    Channels
                                </p>
                                <p className="mb-2 text-[18px] font-semibold tracking-[-0.3px] text-fg">
                                    Subscribe, mute, and manage
                                </p>
                                <p className="mb-4 text-[13px] leading-[1.6] text-muted">
                                    Browse your channels, adjust per-channel notification
                                    preferences, and subscribe to new topics directly from the app.
                                </p>
                                <ul className="m-0 list-none p-0 space-y-2">
                                    {[
                                        'Per-channel mute and notification preferences',
                                        'Subscribe to new topics by typing a name',
                                        'Signal count and last-seen per channel',
                                        'Archive channels you no longer need',
                                        'Shared channels visible to your whole team',
                                    ].map((item) => (
                                        <li
                                            className="flex items-start gap-2 text-[12.5px] text-muted"
                                            key={item}
                                        >
                                            <span className="mt-0.5 text-accent font-mono">→</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Publish */}
                            <div className="rounded-2xl border border-line bg-elev p-6">
                                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[1.4px] text-accent">
                                    Publish
                                </p>
                                <p className="mb-2 text-[18px] font-semibold tracking-[-0.3px] text-fg">
                                    Send signals from your phone
                                </p>
                                <p className="mb-4 text-[13px] leading-[1.6] text-muted">
                                    Publish signals directly from the app. Useful for manual alerts,
                                    status updates, and quick one-off messages to your team or your
                                    own devices.
                                </p>
                                <ul className="m-0 list-none p-0 space-y-2">
                                    {[
                                        'Recent topics auto-suggested',
                                        'Set priority and tags from the publisher',
                                        'Share sheet integration — share any text as a signal',
                                        'Drafts — save signals for later',
                                        'Confirmation on delivery',
                                    ].map((item) => (
                                        <li
                                            className="flex items-start gap-2 text-[12.5px] text-muted"
                                            key={item}
                                        >
                                            <span className="mt-0.5 text-accent font-mono">→</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Section>

                    {/* Settings */}
                    <Section id="settings">
                        <Kicker>Settings</Kicker>
                        <H2>Per-device and per-channel preferences.</H2>

                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                            {[
                                {
                                    desc: 'Suppress push notifications between custom hours. Signals still land in inbox.',
                                    title: 'Quiet hours',
                                },
                                {
                                    desc: 'p5 signals can be configured to bypass quiet hours and Do Not Disturb.',
                                    title: 'Critical bypass',
                                },
                                {
                                    desc: 'App icon badge shows unread count. Configurable: total, or only high-priority.',
                                    title: 'Badge count',
                                },
                                {
                                    desc: 'Set a custom sound per priority level. p5 gets an aggressive tone.',
                                    title: 'Notification sound',
                                },
                                {
                                    desc: 'Dark (default), light, or system. The design is dark-native.',
                                    title: 'Theme',
                                },
                                {
                                    desc: 'Use the app without an account. Subscribe to public topics and receive via device ID.',
                                    title: 'Anonymous mode',
                                },
                            ].map(({ desc, title }) => (
                                <div
                                    className="rounded-xl border border-line bg-elev p-4"
                                    key={title}
                                >
                                    <p className="m-0 mb-1.5 text-[14px] font-semibold text-fg">
                                        {title}
                                    </p>
                                    <p className="m-0 text-[12.5px] leading-[1.5] text-muted">
                                        {desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Tech */}
                    <Section id="tech">
                        <Kicker>Under the Hood</Kicker>
                        <H2>Built with Expo, React Native, and care.</H2>
                        <P>
                            The mobile app is a React Native (Expo) app. It uses Expo Router for
                            navigation, Expo Push Notifications for delivery, and a persistent SSE
                            connection for the live feed. Both iOS and Android ship from one
                            codebase with platform-native feel.
                        </P>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                {
                                    desc: 'Single codebase for iOS and Android. Expo EAS handles CI builds and OTA updates.',
                                    title: 'React Native + Expo',
                                },
                                {
                                    desc: 'Server-side delivery via APNs (iOS) and FCM (Android). Delivery receipts tracked.',
                                    title: 'Expo Push Notifications',
                                },
                                {
                                    desc: 'Persistent Server-Sent Events connection. Reconnects automatically on network changes.',
                                    title: 'SSE for live feed',
                                },
                                {
                                    desc: 'AsyncStorage-backed cache. Signals load from cache instantly while the fresh list fetches.',
                                    title: 'Offline support',
                                },
                                {
                                    desc: 'The mobile app is open source on GitHub. Bug reports and PRs welcome.',
                                    title: 'Open source',
                                },
                                {
                                    desc: 'Every signal and channel has a deep link. Tap a push notification to open the exact signal.',
                                    title: 'Expo Router deep links',
                                },
                            ].map(({ desc, title }) => (
                                <div
                                    className="flex gap-3 rounded-xl border border-line bg-elev p-4"
                                    key={title}
                                >
                                    <span className="mt-0.5 font-mono text-[13px] text-accent">
                                        →
                                    </span>
                                    <div>
                                        <p className="m-0 mb-1 text-[14px] font-semibold text-fg">
                                            {title}
                                        </p>
                                        <p className="m-0 text-[13px] leading-[1.5] text-muted">
                                            {desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Compatibility */}
                    <Section id="requirements">
                        <Kicker>Requirements</Kicker>
                        <H2>Supported platforms.</H2>

                        <div className="overflow-hidden rounded-xl border border-line">
                            {[
                                {
                                    note: 'iPhone and iPad.',
                                    platform: 'iOS',
                                    req: 'iOS 16.0+',
                                },
                                {
                                    note: 'Phone and tablet.',
                                    platform: 'Android',
                                    req: 'Android 10+',
                                },
                            ].map((row) => (
                                <div
                                    className="flex flex-wrap items-center gap-4 border-b border-line px-4 py-3 last:border-0 font-mono text-[12.5px]"
                                    key={row.platform}
                                >
                                    <span className="w-20 text-fg">{row.platform}</span>
                                    <span className="w-28 text-accent">{row.req}</span>
                                    <span className="text-muted">{row.note}</span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <div className="border-t border-line py-12 text-center">
                        <p className="mb-4 text-[14px] text-muted">
                            Free to download. Sign in with your EmitSignal account to sync
                            everything.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <a
                                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-mono text-[13px] font-semibold text-bg no-underline hover:bg-accent-dim"
                                href="#"
                            >
                                App Store →
                            </a>
                            <a
                                className="inline-flex items-center gap-2 rounded-lg border border-line bg-elev px-5 py-2.5 font-mono text-[13px] font-semibold text-fg no-underline hover:bg-elev-2"
                                href="#"
                            >
                                Google Play →
                            </a>
                        </div>
                        <p className="mt-5 font-mono text-[12px] text-dim">
                            No account needed to try it.{' '}
                            <Link className="text-accent no-underline" to="/sign-in">
                                Create an account →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

function H2({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="mb-3 mt-0 text-[26px] font-semibold tracking-[-0.6px] text-fg">
            {children}
        </h2>
    );
}

function Kicker({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[1.6px] text-accent">
            {children}
        </p>
    );
}

function P({ children }: { children: React.ReactNode }) {
    return <p className="mb-4 text-[14px] leading-[1.65] text-muted">{children}</p>;
}

function PhoneFrame({ children, title }: { children: React.ReactNode; title: string }) {
    return (
        <div className="overflow-hidden rounded-[28px] border-[3px] border-line bg-deep shadow-[0_20px_60px_rgba(91,33,182,0.12)]">
            <div className="flex items-center justify-center border-b border-line bg-elev py-3">
                <div className="h-[18px] w-[60px] rounded-full bg-bg" />
            </div>
            <div className="border-b border-line px-3 py-2.5 font-mono text-[10px] text-dim">
                {title}
            </div>
            {children}
        </div>
    );
}

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
    return (
        <section className="border-t border-line py-14" id={id}>
            {children}
        </section>
    );
}
