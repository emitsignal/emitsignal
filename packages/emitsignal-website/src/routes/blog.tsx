import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

import { BlogCategories } from '#/components/blog/blog-categories';
import { SiteFooter } from '#/components/site/site-footer';
import { SiteNav, SiteNavWordmark } from '#/components/site/site-nav';

export const Route = createFileRoute('/blog')({ component: BlogLayout });

function BlogLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-bg font-sans text-fg">
            <SiteNav variant="pinned">
                <SiteNavWordmark
                    section={
                        <Link
                            className="font-semibold text-accent no-underline"
                            search={{ category: 'all', layout: 'grid' }}
                            to="/blog"
                        >
                            blog
                        </Link>
                    }
                />
                <BlogCategories />
            </SiteNav>

            <div className="flex-1">
                <Outlet />
            </div>

            <SiteFooter />
        </div>
    );
}
