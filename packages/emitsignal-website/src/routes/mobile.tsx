import { createFileRoute, Link } from '@tanstack/react-router';
import { Apple, Github } from 'lucide-react';

import { FeatureTabs } from '#/components/mobile/feature-tabs';
import { WidgetGallery } from '#/components/mobile/widget-gallery';
import { SiteFooter } from '#/components/site/site-footer';
import { SiteNav, SiteNavWordmark } from '#/components/site/site-nav';
import { APP_STORE_URL, REPO_URL } from '#/lib/links';

const DESCRIPTION =
    'The EmitSignal app for iOS and Android: live push, an inbox in your terminal, six home-screen and Lock Screen widgets, and publishing from your pocket.';
const TITLE = 'Mobile - EmitSignal';

export const Route = createFileRoute('/mobile')({
    component: MobilePage,
    head: () => ({
        meta: [
            { content: DESCRIPTION, name: 'description' },
            { content: DESCRIPTION, name: 'twitter:description' },
            { content: DESCRIPTION, property: 'og:description' },
            { content: TITLE, name: 'twitter:title' },
            { content: TITLE, property: 'og:title' },
            { title: TITLE },
        ],
    }),
});

/** Intrinsic size of the device captures — set on each img to avoid layout shift. */
const SHOT_HEIGHT = 1348;
const SHOT_WIDTH = 620;

function MobilePage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <SiteNav variant="pinned">
                <SiteNavWordmark />
            </SiteNav>

            <Hero />

            <div className="px-5 sm:px-8 md:px-16">
                <div className="mx-auto max-w-[1100px]">
                    <Section id="features">
                        <H2>Built for the way developers work.</H2>

                        <div className="mt-10">
                            <FeatureTabs />
                        </div>
                    </Section>

                    <Widgets />

                    <Spec />

                    <div className="border-t border-line py-14 text-center">
                        <p className="m-0 mb-5 text-[15px] text-muted">
                            Free to download and usable straight away. An account only matters once
                            you want the same channels on more than one device.
                        </p>

                        <div className="flex flex-wrap justify-center gap-3">
                            <a
                                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-mono text-[13px] font-semibold text-bg no-underline transition-colors hover:bg-accent-hover"
                                href={APP_STORE_URL}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                <Apple size={15} />
                                Download for iOS
                            </a>

                            <a
                                className="inline-flex items-center gap-2 rounded-lg border border-line bg-elev px-5 py-2.5 font-mono text-[13px] font-semibold text-fg no-underline transition-colors hover:bg-elev-2"
                                href={REPO_URL}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                <Github size={15} />
                                Build for Android
                            </a>
                        </div>

                        <p className="m-0 mt-5 font-mono text-[12px] text-dim">
                            Works without an account.{' '}
                            <Link className="text-accent no-underline" to="/sign-in">
                                Sign in to sync your channels →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <SiteFooter />
        </div>
    );
}

function H2({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="m-0 text-[26px] font-semibold tracking-[-0.6px] text-fg md:text-[32px]">
            {children}
        </h2>
    );
}

/** Real captures, not a hand-drawn mockup — the same two the landing page uses. */
function Hero() {
    return (
        <div className="px-5 pb-10 pt-16 sm:px-8 md:px-16 md:pt-20">
            <div className="mx-auto max-w-[1100px]">
                <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                    <div>
                        <h1 className="m-0 mb-5 text-[52px] font-semibold leading-[1.0] tracking-[-1.8px] text-fg sm:text-[60px]">
                            The inbox you carry.
                        </h1>

                        <p className="m-0 mb-7 max-w-[46ch] text-[18px] leading-[1.6] text-muted">
                            Push the instant a signal is published, a feed you can filter, six
                            widgets on your home and Lock Screen, and a publisher in your pocket.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <StoreLink
                                detail="App Store"
                                href={APP_STORE_URL}
                                icon={<Apple size={17} />}
                                label="Download for iOS"
                            />
                            <StoreLink
                                detail="From source"
                                href={REPO_URL}
                                icon={<Github size={17} />}
                                label="Build for Android"
                            />
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-end">
                        <div className="w-[280px] rounded-[40px] border border-line bg-deep p-2 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)]">
                            <img
                                alt="The EmitSignal iOS feed: an inbox of twelve messages across six channels, filter chips for all, p4+, unread and tags, and incidents grouped from P5 critical down to P4 high."
                                className="block w-full rounded-[32px]"
                                decoding="async"
                                draggable={false}
                                fetchPriority="high"
                                height={SHOT_HEIGHT}
                                src="/static/phone-feed.webp"
                                width={SHOT_WIDTH}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Kicker({ children }: { children: React.ReactNode }) {
    return (
        <p className="m-0 mb-2 font-mono text-[10px] uppercase tracking-[1.6px] text-accent">
            {children}
        </p>
    );
}

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
    return (
        <section className="border-t border-line py-14" id={id}>
            {children}
        </section>
    );
}

/**
 * Settings, platform internals and requirements in one place. Three short
 * definition lists beat three more card grids — the page already spends its
 * visual budget on the tabs and the widget gallery.
 *
 * iOS 16.4 is the app's own deployment target, read from the Xcode project; the
 * widget extension sets 17.0 separately. No Android minimum is quoted because
 * the project inherits it from the Expo Gradle plugin rather than pinning one.
 */
function Spec() {
    const columns: Array<{ heading: string; rows: Array<[string, string]> }> = [
        {
            heading: 'Preferences',
            rows: [
                ['Theme', 'Light, dark, or system'],
                ['Feed style', 'Comfy, timeline, or priority-first'],
                ['Push', 'Per device, and per channel'],
                ['Sign-in', 'Email code, Apple, or GitHub'],
                ['Anonymous', 'Skip the account entirely'],
            ],
        },
        {
            heading: 'Internals',
            rows: [
                ['Runtime', 'Expo SDK 56 · React Native 0.85'],
                ['Delivery', 'APNs and FCM, from a BullMQ queue'],
                ['Live feed', 'Server-Sent Events'],
                ['Deep links', 'Expo Router, /messages/:id'],
                ['Widgets', 'WidgetKit over a shared App Group'],
            ],
        },
        {
            heading: 'Requirements',
            rows: [
                ['iOS', '16.4+ · iPhone and iPad'],
                ['Widgets', 'iOS 17.0+'],
                ['Android', 'From source; not yet on Google Play'],
                ['Licence', 'AGPL-3.0, same repo as the server'],
                ['Price', 'Free'],
            ],
        },
    ];

    return (
        <Section id="spec">
            <H2>Settings, internals, requirements.</H2>

            <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-3">
                {columns.map((column) => (
                    <div key={column.heading}>
                        <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[1.6px] text-faint">
                            {column.heading}
                        </p>

                        <dl className="m-0">
                            {column.rows.map(([term, definition]) => (
                                <div
                                    className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-0"
                                    key={term}
                                >
                                    <dt className="shrink-0 font-mono text-[11.5px] text-dim">
                                        {term}
                                    </dt>
                                    <dd className="m-0 text-right text-[13px] leading-[1.45] text-muted">
                                        {definition}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function StoreLink({
    detail,
    href,
    icon,
    label,
}: {
    detail: string;
    href: string;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <a
            className="flex items-center gap-3 rounded-xl border border-line bg-elev px-4 py-3 no-underline transition-colors hover:border-accent/40"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
        >
            <span className="text-fg">{icon}</span>
            <span>
                <span className="block font-mono text-[9px] uppercase tracking-[1.4px] text-dim">
                    {detail}
                </span>
                <span className="block text-[13.5px] font-semibold text-fg">{label}</span>
            </span>
        </a>
    );
}

function Widgets() {
    return (
        <Section id="widgets">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                    <Kicker>Widgets</Kicker>
                    <H2>Six widgets, without opening the app.</H2>
                </div>

                <p className="m-0 max-w-[46ch] text-[15px] leading-[1.6] text-muted md:text-right">
                    Previews rendered at true point sizes from the snapshot the app shares with
                    WidgetKit. iOS only.
                </p>
            </div>

            <div className="mt-8">
                <WidgetGallery />
            </div>
        </Section>
    );
}
