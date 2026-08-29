import type { ComponentType } from 'react';

import { createFileRoute, notFound } from '@tanstack/react-router';

import { BlogArticleView } from '#/components/blog/blog-article-view';
import { AUTHORS } from '#/lib/blog';
import { fetchPostMeta, type PostDetail } from '#/lib/blog-fns';
import { breadcrumbSchema, buildSeoMeta, jsonLdScript, SITE_NAME, SITE_URL } from '#/lib/seo';

// Eagerly bundled for both SSR and client navigation
const MDX_MODULES = import.meta.glob('/src/content/blog/*.mdx', { eager: true }) as Record<
    string,
    { default: ComponentType }
>;

export const Route = createFileRoute('/blog/$slug')({
    component: BlogArticlePage,
    head: ({ loaderData, params }) => {
        const data = loaderData as PostDetail | undefined;
        if (!data) return { meta: [] };
        const { frontmatter } = data;

        const author = AUTHORS[frontmatter.author];
        const description = frontmatter.excerpt;
        const path = `/blog/${params.slug}`;
        const title = `${frontmatter.title} - EmitSignal Blog`;

        const ogImage = data.ogImage;

        const articleSchema = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            author: { '@type': 'Person', name: author.name },
            datePublished: frontmatter.date,
            description,
            headline: frontmatter.title,
            image: ogImage,
            keywords: frontmatter.tags.join(', '),
            mainEntityOfPage: `${SITE_URL}${path}`,
            publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        };

        return {
            ...buildSeoMeta({ description, image: ogImage, path, title, type: 'article' }),
            scripts: [
                jsonLdScript(articleSchema),
                jsonLdScript(
                    breadcrumbSchema([
                        { name: 'EmitSignal', path: '/' },
                        { name: 'Blog', path: '/blog' },
                        { name: frontmatter.title, path },
                    ]),
                ),
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
