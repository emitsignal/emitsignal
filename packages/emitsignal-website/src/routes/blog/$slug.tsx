import type { ComponentType } from 'react';

import { createFileRoute, notFound } from '@tanstack/react-router';

import { BlogArticleView } from '#/components/blog/blog-article-view';
import { AUTHORS } from '#/lib/blog';
import { fetchPostMeta, type PostDetail } from '#/lib/blog-fns';

// Eagerly bundled for both SSR and client navigation
const MDX_MODULES = import.meta.glob('/src/content/blog/*.mdx', { eager: true }) as Record<
    string,
    { default: ComponentType }
>;

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://emitsignal.com';

export const Route = createFileRoute('/blog/$slug')({
    component: BlogArticlePage,
    head: ({ loaderData, params }) => {
        const data = loaderData as PostDetail | undefined;
        if (!data) return { meta: [] };
        const { frontmatter } = data;

        const author = AUTHORS[frontmatter.author];
        const description = frontmatter.excerpt;
        const title = `${frontmatter.title} — EmitSignal Blog`;
        const url = `${SITE_URL}/blog/${params.slug}`;

        const ogImage =
            `${SITE_URL}/api/og` +
            `?author=${encodeURIComponent(author.name)}` +
            `&category=${frontmatter.category}` +
            `&date=${frontmatter.date}` +
            `&description=${encodeURIComponent(description)}` +
            `&readTime=${frontmatter.readTime}` +
            `&template=${frontmatter.featured ? 'field' : 'editorial'}` +
            `&title=${encodeURIComponent(frontmatter.title)}` +
            `&views=${frontmatter.views}`;

        return {
            meta: [
                { title },
                { content: description, name: 'description' },
                { content: title, property: 'og:title' },
                { content: description, property: 'og:description' },
                { content: url, property: 'og:url' },
                { content: ogImage, property: 'og:image' },
                { content: 'article', property: 'og:type' },
                { content: 'summary_large_image', name: 'twitter:card' },
                { content: title, name: 'twitter:title' },
                { content: description, name: 'twitter:description' },
                { content: ogImage, name: 'twitter:image' },
            ],
        };
    },
    loader: async ({ params }) => {
        const detail = await fetchPostMeta({ data: params.slug });

        if (!detail) {
            throw notFound();
        }
        return detail;
    },
});

function BlogArticlePage() {
    const { slug } = Route.useParams();
    const detail = Route.useLoaderData() as PostDetail | undefined;

    const Content = MDX_MODULES[`/src/content/blog/${slug}.mdx`]?.default;

    if (!Content || !detail) {
        return null;
    }

    return <BlogArticleView Content={Content} slug={slug} {...detail} />;
}
