import { useNavigate } from '@tanstack/react-router';

import type { PostCategory, PostMeta } from '#/lib/blog';

import { CATEGORIES } from '#/lib/blog';
import { cn } from '#/lib/cn';

import { BlogFeatured } from './blog-featured';
import { PostCard, PostRow } from './blog-post-card';
import { NewsletterCta } from './newsletter-cta';

interface BlogIndexViewProps {
    category: 'all' | PostCategory;
    layout: 'grid' | 'list';
    posts: PostMeta[];
}

export function BlogIndexView({ category, layout, posts }: BlogIndexViewProps) {
    const featured = posts.find((post) => post.frontmatter.featured) ?? posts[0];

    const filtered =
        category === 'all' ? posts : posts.filter((p) => p.frontmatter.category === category);

    const gridPosts =
        category === 'all' ? filtered.filter((p) => p.slug !== featured?.slug) : filtered;

    return (
        <div className="mx-auto max-w-[1200px] px-5 pb-16 md:px-10">
            {/* Header */}
            <header className="relative pb-9 pt-14">
                <div
                    className="pointer-events-none absolute -left-20 top-5 h-80 w-[420px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, #a78bfa22, transparent 65%)',
                        filter: 'blur(50px)',
                    }}
                />
                <div className="relative">
                    <div className="mb-4 flex items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-[2.5px] text-accent">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_9px_var(--color-accent)]" />
                        The Signal · the EmitSignal blog
                    </div>
                    <h1 className="mb-4 font-sans text-[40px] font-semibold leading-[1.02] tracking-[-2px] text-fg sm:text-[52px] md:text-[56px]">
                        Dispatches from
                        <br />
                        the pubsub layer.
                    </h1>
                    <p className="max-w-[560px] text-[18px] leading-[1.55] text-muted">
                        Product news, engineering deep dives, release notes, and step-by-step
                        integrations — written by the team that gets paged when the pipe is slow.
                    </p>
                </div>
            </header>

            {/* Featured */}
            {category === 'all' && featured && <BlogFeatured post={featured} />}

            {/* Filter row */}
            <CatFilterRow category={category} count={filtered.length} layout={layout} />

            {/* Post grid / list */}
            {layout === 'grid' ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gridPosts.map((p) => (
                        <PostCard key={p.slug} post={p} />
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-line">
                    {gridPosts.map((p, i) => (
                        <PostRow key={p.slug} last={i === gridPosts.length - 1} post={p} />
                    ))}
                </div>
            )}

            {gridPosts.length === 0 && (
                <div className="py-20 text-center font-mono text-[13px] text-dim">
                    No posts in this category yet.
                </div>
            )}

            <div className="mt-7">
                <NewsletterCta />
            </div>
        </div>
    );
}

const categories: Array<'all' | PostCategory> = [
    'all',
    'changelog',
    'engineering',
    'product',
    'tutorial',
];

function CatFilterRow({
    category,
    count,
    layout,
}: {
    category: 'all' | PostCategory;
    count: number;
    layout: 'grid' | 'list';
}) {
    const navigate = useNavigate();

    function go(newCat: 'all' | PostCategory) {
        navigate({ search: { category: newCat, layout }, to: '/blog' });
    }

    function toggleLayout() {
        navigate({
            search: { category, layout: layout === 'grid' ? ('list' as const) : ('grid' as const) },
            to: '/blog',
        });
    }

    return (
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
            {categories.map((_category) => {
                const active = (category ?? 'all') === _category;
                const c =
                    _category === 'all'
                        ? { color: '#a78bfa', label: 'All posts' }
                        : CATEGORIES[_category];

                return (
                    <button
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[12px] font-semibold transition-all',
                        )}
                        key={_category}
                        onClick={() => go(_category)}
                        style={{
                            background: active ? c.color + '1c' : 'transparent',
                            borderColor: active ? c.color : 'var(--color-line)',
                            color: active ? c.color : 'var(--color-muted)',
                        }}
                        type="button"
                    >
                        <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                                background: c.color,
                                boxShadow: active ? `0 0 7px ${c.color}` : 'none',
                                opacity: active ? 1 : 0.5,
                            }}
                        />
                        {c.label}
                    </button>
                );
            })}

            <span className="ml-auto font-mono text-[11.5px] text-dim">
                {count} post{count !== 1 ? 's' : ''}
            </span>

            <button
                className="rounded border border-line px-3 py-1.5 font-mono text-[11.5px] text-dim transition-colors hover:text-muted"
                onClick={toggleLayout}
                title={layout === 'grid' ? 'Switch to list' : 'Switch to grid'}
                type="button"
            >
                {layout === 'grid' ? '≡ list' : '⊞ grid'}
            </button>
        </div>
    );
}
