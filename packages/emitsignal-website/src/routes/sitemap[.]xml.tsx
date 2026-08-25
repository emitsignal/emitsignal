import { createFileRoute } from '@tanstack/react-router';

import { fetchAllPosts } from '#/lib/blog-fns';
import { absoluteUrl } from '#/lib/seo';

interface SitemapEntry {
    changefreq: string;
    lastmod?: string;
    path: string;
    priority: string;
}

/** Public routes only. Anything carrying `noindex` must stay out of this list. */
const STATIC_ENTRIES: SitemapEntry[] = [
    { changefreq: 'weekly', path: '/', priority: '1.0' },
    { changefreq: 'weekly', path: '/blog', priority: '0.8' },
    { changefreq: 'weekly', path: '/changelog', priority: '0.7' },
    { changefreq: 'monthly', path: '/mobile', priority: '0.7' },
    { changefreq: 'yearly', path: '/terms', priority: '0.3' },
    { changefreq: 'yearly', path: '/privacy', priority: '0.3' },
    { changefreq: 'yearly', path: '/code-of-conduct', priority: '0.3' },
];

function renderEntry({ changefreq, lastmod, path, priority }: SitemapEntry): string {
    const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';

    return `<url><loc>${absoluteUrl(path)}</loc>${lastmodTag}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export const Route = createFileRoute('/sitemap.xml')({
    server: {
        handlers: {
            GET: async () => {
                const posts = await fetchAllPosts();

                const entries = [
                    ...STATIC_ENTRIES,
                    ...posts.map(
                        (post): SitemapEntry => ({
                            changefreq: 'monthly',
                            lastmod: post.frontmatter.date,
                            path: `/blog/${post.slug}`,
                            priority: '0.6',
                        }),
                    ),
                ];

                const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(renderEntry).join('')}</urlset>`;

                return new Response(body, {
                    headers: {
                        'cache-control': 'public, max-age=0, s-maxage=3600',
                        'content-type': 'application/xml; charset=utf-8',
                    },
                });
            },
        },
    },
});
