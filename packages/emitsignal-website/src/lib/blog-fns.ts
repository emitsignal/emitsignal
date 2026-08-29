import { createServerFn } from '@tanstack/react-start';

import type { PostFrontmatter, PostHeading, PostMeta } from './blog';

import { AUTHORS } from './blog';
import { signedOgUrl } from './og-signature';
import { SITE_URL } from './seo';

type MDXMetaModule = {
    frontmatter: PostFrontmatter;
    headings?: PostHeading[];
};

function slugFromPath(path: string): string {
    return path.replace('/src/content/blog/', '').replace('.mdx', '');
}

function sortedPosts(modules: Record<string, MDXMetaModule>): PostMeta[] {
    return Object.entries(modules)
        .map(([path, m]) => ({
            frontmatter: m.frontmatter,
            headings: m.headings ?? [],
            slug: slugFromPath(path),
        }))
        .sort(
            (a, b) =>
                new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime(),
        );
}

export const fetchAllPosts = createServerFn().handler((): PostMeta[] => {
    // import.meta.glob inside handler → stripped from client bundle
    const modules = import.meta.glob<MDXMetaModule>('/src/content/blog/*.mdx', {
        eager: true,
    });

    return sortedPosts(modules);
});

export type PostDetail = {
    frontmatter: PostFrontmatter;
    headings: PostHeading[];
    next: null | PostMeta;
    ogImage: string;
    related: PostMeta[];
};

// Signed here, not in the route's head(), so the secret stays server-side.
function postOgImage(frontmatter: PostFrontmatter): string {
    return signedOgUrl(SITE_URL, {
        author: AUTHORS[frontmatter.author].name,
        category: frontmatter.category,
        date: frontmatter.date,
        description: frontmatter.excerpt,
        readTime: String(frontmatter.readTime),
        template: frontmatter.featured ? 'field' : 'editorial',
        title: frontmatter.title,
    });
}

export const fetchPostMeta = createServerFn()
    .validator((slug: string) => slug)
    .handler(({ data: slug }): null | PostDetail => {
        const modules = import.meta.glob<MDXMetaModule>('/src/content/blog/*.mdx', {
            eager: true,
        });

        const posts = sortedPosts(modules);
        const meta = posts.find((post) => post.slug === slug);

        if (!meta) {
            return null;
        }

        const currentIndex = posts.findIndex((post) => post.slug === slug);

        const next =
            currentIndex >= 0 && currentIndex < posts.length - 1
                ? posts[currentIndex + 1]
                : posts[0];

        const relatedPosts = posts
            .filter((post) => post.slug !== slug)
            .sort(
                (a, b) =>
                    (b.frontmatter.category === meta.frontmatter.category ? 1 : 0) -
                    (a.frontmatter.category === meta.frontmatter.category ? 1 : 0),
            )
            .slice(0, 3);

        return {
            frontmatter: meta.frontmatter,
            headings: meta.headings,
            next: next ?? null,
            ogImage: postOgImage(meta.frontmatter),
            related: relatedPosts,
        };
    });
