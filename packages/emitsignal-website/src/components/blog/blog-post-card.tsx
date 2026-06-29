import { Link } from '@tanstack/react-router';

import type { PostMeta } from '#/lib/blog';

import { Avatar } from '#/components/ui/avatar';
import { AUTHORS, fmtDate } from '#/lib/blog';
import { cn } from '#/lib/cn';

import { CatPill } from './cat-pill';

interface PostCardProps {
    post: PostMeta;
}

export function PostCard({ post }: PostCardProps) {
    const author = AUTHORS[post.frontmatter.author];

    return (
        <Link
            className={cn(
                'group flex flex-col rounded-2xl border border-line p-5 transition-all duration-150',
                'hover:-translate-y-0.5 hover:border-accent/35 hover:bg-elev',
                'bg-elev/50',
            )}
            params={{ slug: post.slug }}
            to="/blog/$slug"
        >
            <div className="mb-4 flex items-center gap-2.5">
                <CatPill category={post.frontmatter.category} size="sm" />
            </div>

            <h3 className="mb-2.5 font-sans text-[19px] font-semibold leading-[1.2] tracking-tight text-fg">
                {post.frontmatter.title}
            </h3>

            <p className="mb-4 line-clamp-3 flex-1 text-[13.5px] leading-[1.55] text-muted">
                {post.frontmatter.excerpt}
            </p>

            <div className="flex items-center gap-2.5 border-t border-line pt-3.5">
                <Avatar name={author.name} rounded={999} size={22} src={author.photo ?? null} />

                <span className="font-mono text-[11.5px] text-muted">
                    {author.name.split(' ')[0]}
                </span>

                <span className="ml-auto font-mono text-[11px] text-dim">
                    {fmtDate(post.frontmatter.date)} · {post.frontmatter.readTime}m
                </span>
            </div>
        </Link>
    );
}

export function PostRow({ last, post }: { last: boolean } & PostCardProps) {
    const author = AUTHORS[post.frontmatter.author];

    return (
        <Link
            className={cn(
                'group grid grid-cols-[120px_1fr_auto] items-center gap-5 px-6 py-5 transition-colors hover:bg-elev',
                !last && 'border-b border-line',
            )}
            params={{ slug: post.slug }}
            to="/blog/$slug"
        >
            <CatPill category={post.frontmatter.category} size="sm" />

            <div className="min-w-0">
                <h3 className="mb-1 font-sans text-[17px] font-semibold leading-tight tracking-tight text-fg">
                    {post.frontmatter.title}
                </h3>

                <p className="truncate text-[13px] text-muted">{post.frontmatter.excerpt}</p>
            </div>

            <div className="flex items-center gap-3 whitespace-nowrap font-mono text-[11.5px] text-dim">
                <Avatar name={author.name} rounded={999} size={20} src={author.photo ?? null} />

                <span>{fmtDate(post.frontmatter.date)}</span>
                <span className="transition-colors group-hover:text-accent">
                    {post.frontmatter.readTime}m →
                </span>
            </div>
        </Link>
    );
}
