import { createFileRoute, Outlet } from '@tanstack/react-router';

import { BlogFooter } from '#/components/blog/blog-footer';
import { BlogNav } from '#/components/blog/blog-nav';

export const Route = createFileRoute('/blog')({ component: BlogLayout });

function BlogLayout() {
    return (
        <div className="min-h-screen bg-bg font-sans text-fg">
            <BlogNav />
            <Outlet />
            <BlogFooter />
        </div>
    );
}
