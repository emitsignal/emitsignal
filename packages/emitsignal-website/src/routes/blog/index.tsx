import { createFileRoute } from '@tanstack/react-router';

import type { PostCategory } from '#/lib/blog';

import { BlogIndexView } from '#/components/blog/blog-index-view';
import { fetchAllPosts } from '#/lib/blog-fns';

type BlogSearch = {
    category: 'all' | PostCategory;
    layout: 'grid' | 'list';
};

const BLOG_DESCRIPTION =
    'Engineering deep-dives, product updates, tutorials, and changelog from the EmitSignal team.';

export const Route = createFileRoute('/blog/')({
    component: BlogPage,
    head: () => ({
        meta: [
            { title: 'Blog — EmitSignal' },
            { content: BLOG_DESCRIPTION, name: 'description' },
            { content: 'Blog — EmitSignal', property: 'og:title' },
            { content: BLOG_DESCRIPTION, property: 'og:description' },
            { content: 'https://emitsignal.com/blog', property: 'og:url' },
            { content: 'website', property: 'og:type' },
            { content: 'summary', name: 'twitter:card' },
            { content: 'Blog — EmitSignal', name: 'twitter:title' },
            { content: BLOG_DESCRIPTION, name: 'twitter:description' },
        ],
    }),
    loader: async () => {
        const posts = await fetchAllPosts();
        return { posts };
    },
    validateSearch: (search: Record<string, unknown>): BlogSearch => ({
        category: (['all', 'changelog', 'engineering', 'product', 'tutorial'].includes(
            search.category as string,
        )
            ? search.category
            : 'all') as BlogSearch['category'],
        layout: (search.layout === 'list' ? 'list' : 'grid') as BlogSearch['layout'],
    }),
});

function BlogPage() {
    const { posts } = Route.useLoaderData();
    const { category, layout } = Route.useSearch();
    return <BlogIndexView category={category} layout={layout} posts={posts} />;
}
