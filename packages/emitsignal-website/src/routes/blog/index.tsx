import { createFileRoute } from '@tanstack/react-router';

import type { PostCategory } from '#/lib/blog';

import { BlogIndexView } from '#/components/blog/blog-index-view';
import { fetchAllPosts } from '#/lib/blog-fns';
import { breadcrumbSchema, buildSeoMeta, jsonLdScript } from '#/lib/seo';

type BlogSearch = {
    category: 'all' | PostCategory;
    layout: 'grid' | 'list';
};

const BLOG_DESCRIPTION =
    'Engineering deep-dives, product updates, tutorials, and changelog from the people building EmitSignal.';

const BLOG_TITLE = 'Blog - EmitSignal';

export const Route = createFileRoute('/blog/')({
    component: BlogPage,
    head: () => ({
        // The canonical deliberately drops `?category` and `?layout`: every combination
        // renders the same post list, so they must not compete as separate URLs.
        ...buildSeoMeta({ description: BLOG_DESCRIPTION, path: '/blog', title: BLOG_TITLE }),
        scripts: [
            jsonLdScript(
                breadcrumbSchema([
                    { name: 'EmitSignal', path: '/' },
                    { name: 'Blog', path: '/blog' },
                ]),
            ),
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
