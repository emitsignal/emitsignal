import { createFileRoute } from '@tanstack/react-router';

import { SiteFooter } from '#/components/site/site-footer';
import { SiteNav, SiteNavWordmark } from '#/components/site/site-nav';
import { CHANGELOG_RELEASES } from '#/data/changelog.generated';
import { buildSeoMeta } from '#/lib/seo';

const DESCRIPTION =
    'Every EmitSignal release, dated and itemized: new features, fixes, and breaking changes across the API, apps, and CLI.';
const TITLE = 'Changelog - EmitSignal';

export const Route = createFileRoute('/changelog')({
    component: ChangelogPage,
    head: () => buildSeoMeta({ description: DESCRIPTION, path: '/changelog', title: TITLE }),
});

function ChangelogPage() {
    const latest = CHANGELOG_RELEASES[0];

    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <SiteNav variant="pinned">
                <SiteNavWordmark />
            </SiteNav>

            {/* Hero */}
            <div className="px-5 pb-10 pt-16 sm:px-8 md:px-16 md:pt-20">
                <div className="mx-auto max-w-[760px]">
                    <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_var(--color-success)]" />
                        Latest: v{latest.version} · {latest.date}
                    </div>
                    <h1 className="m-0 mb-5 text-[52px] font-semibold leading-[1.0] tracking-[-1.8px] text-fg sm:text-[64px]">
                        Changelog
                    </h1>
                    <p className="text-[18px] leading-[1.6] text-muted">
                        Every release, every change. From private beta to general availability.
                    </p>
                </div>
            </div>

            <div className="px-5 pb-20 sm:px-8 md:px-16">
                <div className="mx-auto max-w-[760px]">
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[7px] top-0 bottom-0 w-px bg-line" />

                        <div className="space-y-14">
                            {CHANGELOG_RELEASES.map((release) => (
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

            <SiteFooter />
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
