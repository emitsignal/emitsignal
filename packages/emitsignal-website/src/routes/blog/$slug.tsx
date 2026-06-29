import type { ComponentType } from 'react';

import { createFileRoute, notFound } from '@tanstack/react-router';

import { BlogArticleView } from '#/components/blog/blog-article-view';
import { fetchPostMeta } from '#/lib/blog-fns';

// Eagerly bundled for both SSR and client navigation
const MDX_MODULES = import.meta.glob('/src/content/blog/*.mdx', { eager: true }) as Record<
    string,
    { default: ComponentType }
>;

export const Route = createFileRoute('/blog/$slug')({
    component: BlogArticlePage,
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
    const detail = Route.useLoaderData();

    const Content = MDX_MODULES[`/src/content/blog/${slug}.mdx`]?.default;

    if (!Content) {
        return null;
    }

    return <BlogArticleView Content={Content} slug={slug} {...detail} />;
}
