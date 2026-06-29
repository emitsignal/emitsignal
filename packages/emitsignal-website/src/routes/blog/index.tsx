import { createFileRoute } from '@tanstack/react-router';

import type { PostCategory } from '#/lib/blog';

import { BlogIndexView } from '#/components/blog/blog-index-view';
import { fetchAllPosts } from '#/lib/blog-fns';

type BlogSearch = {
    category: 'all' | PostCategory;
    layout: 'grid' | 'list';
};

export const Route = createFileRoute('/blog/')({
    component: BlogPage,
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
