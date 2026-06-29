import type { ComponentType } from 'react';

import { Link } from '@tanstack/react-router';

import type { PostFrontmatter, PostHeading, PostMeta } from '#/lib/blog';

import { Avatar } from '#/components/ui/avatar';
import { AUTHORS, CATEGORIES, fmtDate } from '#/lib/blog';

import { PostCard } from './blog-post-card';
import { BlogToc } from './blog-toc';
import { CatPill } from './cat-pill';
import { mdxComponents } from './mdx-components';
import { NewsletterCta } from './newsletter-cta';

interface BlogArticleViewProps {
    Content: ComponentType;
    frontmatter: PostFrontmatter;
    headings: PostHeading[];
    next: null | PostMeta;
    related: PostMeta[];
    slug: string;
}

export function BlogArticleView({
    Content,
    frontmatter,
    headings,
    next,
    related,
    slug,
}: BlogArticleViewProps) {
    const author = AUTHORS[frontmatter.author];
    const category = CATEGORIES[frontmatter.category];
    const MDXContent = Content as ComponentType<{ components: typeof mdxComponents }>;

    return (
        <div>
            {/* Hero band */}
            <div className="relative overflow-hidden border-b border-line">
                <div
                    className="pointer-events-none absolute top-[-60px] w-[500px] rounded-full"
                    style={{
                        background: `radial-gradient(circle, ${category.color}1c, transparent 65%)`,
                        filter: 'blur(60px)',
                        height: 320,
                        left: '20%',
                    }}
                />

                <div className="relative mx-auto max-w-[800px] px-5 py-10 md:px-10">
                    <Link
                        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[12px] text-muted transition-colors hover:text-fg"
                        search={{ category: frontmatter.category, layout: 'grid' }}
                        to="/blog"
                    >
                        ← blog / {category.label.toLowerCase()}
                    </Link>

                    <div className="mb-5">
                        <CatPill category={frontmatter.category} />
                    </div>

                    <h1 className="mb-5 font-sans text-[36px] font-semibold leading-[1.08] tracking-[-1.6px] text-fg md:text-[44px]">
                        {frontmatter.title}
                    </h1>

                    <p className="mb-7 max-w-[680px] text-[19px] leading-[1.55] text-muted">
                        {frontmatter.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 font-mono text-[11.5px]">
                        <div className="flex items-center gap-2.5">
                            <Avatar
                                name={author.name}
                                rounded={999}
                                size={36}
                                src={author.photo ?? null}
                            />
                            <div className="leading-tight">
                                <div className="text-[14px] font-semibold text-fg">
                                    {author.name}
                                </div>

                                <div style={{ color: category.color }}>{author.role}</div>
                            </div>
                        </div>

                        <span className="text-faint">·</span>
                        <span className="text-dim">
                            {fmtDate(frontmatter.date)} · {frontmatter.readTime} min read
                        </span>
                    </div>
                </div>
            </div>

            {/* Body + ToC */}
            <div className="mx-auto grid max-w-[1080px] gap-14 px-5 py-10 md:px-10 lg:grid-cols-[1fr_220px]">
                <article className="min-w-0">
                    <MDXContent components={mdxComponents} />

                    {/* Tags */}
                    <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6">
                        {frontmatter.tags.map((tag) => (
                            <span
                                className="rounded border border-line bg-chip px-2.5 py-1 font-mono text-[11.5px] text-muted"
                                key={tag}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {/* Author bio */}
                    <div className="mt-8 flex gap-4 rounded-2xl border border-line bg-elev p-6">
                        <Avatar
                            name={author.name}
                            rounded={999}
                            size={52}
                            src={author.photo ?? null}
                        />
                        <div>
                            <div className="mb-1 flex items-center gap-2.5">
                                <span className="text-base font-semibold text-fg">
                                    {author.name}
                                </span>
                                <span
                                    className="font-mono text-[11.5px]"
                                    style={{ color: category.color }}
                                >
                                    {author.handle}
                                </span>
                            </div>
                            <div className="mb-2 font-mono text-[11px] text-dim">{author.role}</div>
                            <p className="text-[13.5px] leading-[1.6] text-muted">{author.bio}</p>
                        </div>
                    </div>

                    {/* Next up */}
                    {next && (
                        <Link
                            className="mt-0  mt-4 flex items-center gap-4 rounded-xl border border-line bg-elev/40 p-5 transition-colors hover:border-accent/35"
                            params={{ slug: next.slug }}
                            to="/blog/$slug"
                        >
                            <div className="flex-1">
                                <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[1.5px] text-dim">
                                    Next up
                                </div>
                                <div className="text-base font-semibold text-fg">
                                    {next.frontmatter.title}
                                </div>
                            </div>
                            <span className="text-lg text-accent">→</span>
                        </Link>
                    )}
                </article>

                <BlogToc headings={headings} slug={slug} />
            </div>

            {/* Newsletter */}
            <div className="mx-auto max-w-[1080px] px-5 pb-5 md:px-10">
                <NewsletterCta />
            </div>

            {/* Related posts */}
            {related.length > 0 && (
                <div className="mx-auto max-w-[1080px] border-t border-line px-5 py-12 pb-16 md:px-10">
                    <div className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[2px] text-accent">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
                        Keep reading
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {related.map((p) => (
                            <PostCard key={p.slug} post={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
