import { Link } from '@tanstack/react-router';

import type { PostMeta } from '#/lib/blog';

import { Avatar } from '#/components/ui/avatar';
import { AUTHORS, CATEGORIES, fmtDate } from '#/lib/blog';

import { CatPill } from './cat-pill';

interface BlogFeaturedProps {
    post: PostMeta;
}

const STREAM_EVENTS = [
    { ch: 'deploy/prod', color: '#a78bfa', m: 'v2.14.3 shipped', t: '21:52:01' },
    { ch: 'alerts/prod', color: '#f87171', m: 'High memory api-02', t: '21:52:14' },
    { ch: 'ci/web', color: '#4ade80', m: 'Build passed · 247', t: '21:52:22' },
    { ch: 'github/acme', color: '#67e8f9', m: 'PR #482 approved', t: '21:53:44' },
    { ch: 'cron/backup', color: '#fbbf24', m: '✓ 14.2 GB → s3', t: '21:55:02' },
    { ch: 'errors/web', color: '#f87171', m: 'TypeError spike · 34', t: '21:58:11' },
];

export function BlogFeatured({ post }: BlogFeaturedProps) {
    const author = AUTHORS[post.frontmatter.author];
    const category = CATEGORIES[post.frontmatter.category];

    console.log({ author, category, post });

    return (
        <Link
            className="group mb-8 grid overflow-hidden rounded-2xl border border-line transition-colors hover:border-accent/40 md:grid-cols-[1.15fr_1fr]"
            params={{ slug: post.slug }}
            to="/blog/$slug"
        >
            {/* Content */}
            <div className="bg-elev p-8 md:p-10">
                <div className="mb-5 flex items-center gap-3">
                    <span
                        className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[2px]"
                        style={{ color: category.color }}
                    >
                        <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                                background: category.color,
                                boxShadow: `0 0 8px ${category.color}`,
                            }}
                        />
                        Featured
                    </span>

                    <CatPill category={post.frontmatter.category} size="sm" />
                </div>

                <h2 className="mb-4 font-sans text-[28px] font-semibold leading-[1.08] tracking-[-0.8px] text-fg md:text-[34px]">
                    {post.frontmatter.title}
                </h2>

                <p className="mb-6 max-w-lg text-[15.5px] leading-[1.6] text-muted">
                    {post.frontmatter.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-3.5 text-dim">
                    <Avatar name={author.name} rounded={999} size={36} src={author.photo ?? null} />

                    <span className="font-sans text-[13px] font-semibold text-fg">
                        {author.name}
                    </span>

                    <span className="text-faint">·</span>
                    <span className="font-mono text-[11px]" style={{ color: category.color }}>
                        {author.role}
                    </span>

                    <span className="text-faint">·</span>
                    <span className="font-mono text-[11.5px]">
                        {fmtDate(post.frontmatter.date)} · {post.frontmatter.readTime}m read
                    </span>
                </div>
            </div>

            {/* Decorative terminal stream */}
            <div className="relative hidden overflow-hidden border-t border-line bg-deep md:block md:border-l md:border-t-0">
                <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5 font-mono text-[11px] text-dim">
                    <span className="flex gap-1.5">
                        {['#ff5f56', '#ffbd2e', '#27c93f'].map((color) => (
                            <span
                                className="h-2 w-2 rounded-full"
                                key={color}
                                style={{ background: color }}
                            />
                        ))}
                    </span>

                    <span className="ml-2">emitsignal listen — p99 280ms</span>
                    <span className="ml-auto flex items-center gap-1.5 text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]" />
                        live
                    </span>
                </div>

                <div className="flex flex-col gap-2 p-4">
                    {STREAM_EVENTS.map((streamEvents, index) => (
                        <div
                            className="flex items-center gap-2.5 font-mono text-[11.5px]"
                            key={index}
                            style={{ opacity: 1 - index * 0.07 }}
                        >
                            <span className="text-faint">{streamEvents.t}</span>
                            <span style={{ color: streamEvents.color }}>●</span>
                            <span className="w-20 overflow-hidden text-ellipsis whitespace-nowrap text-dim">
                                {streamEvents.ch}
                            </span>
                            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-muted">
                                {streamEvents.m}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="p-4 font-mono text-[11.5px] text-accent">
                    ${' '}
                    <span className="inline-block h-[13px] w-[7px] animate-[signal-caret_1s_steps(2)_infinite] bg-accent align-middle" />
                </div>
            </div>
        </Link>
    );
}
