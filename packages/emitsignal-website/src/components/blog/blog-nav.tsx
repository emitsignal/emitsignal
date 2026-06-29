import { Link, useNavigate, useSearch } from '@tanstack/react-router';

import type { PostCategory } from '#/lib/blog';

import { Logo } from '#/components/ui/logo';
import { cn } from '#/lib/cn';

const NAV_ITEMS: Array<{ category: 'all' | PostCategory; label: string }> = [
    { category: 'all', label: 'All' },
    { category: 'product', label: 'Product' },
    { category: 'engineering', label: 'Engineering' },
    { category: 'tutorial', label: 'Integrations' },
    { category: 'changelog', label: 'Changelog' },
];

export function BlogNav() {
    return (
        <nav className="sticky top-0 z-30 flex items-center gap-6 border-b border-line bg-bg/80 px-5 py-3.5 backdrop-blur-md md:px-10">
            <Link
                className="flex items-center gap-2 font-mono text-[12.5px]"
                search={{ category: 'all', layout: 'grid' }}
                to="/blog"
            >
                <Logo className="text-accent" size={14} />
                <span className="text-faint">/</span>
                <span className="font-semibold text-accent">blog</span>
            </Link>
            <CategoryLinks />
            <div className="ml-auto hidden items-center gap-4 md:flex">
                <Link
                    className="font-mono text-[12.5px] text-muted transition-colors hover:text-fg"
                    to="/"
                >
                    Home
                </Link>

                <Link
                    className="rounded-md bg-accent px-3.5 py-1.5 font-mono text-[12.5px] font-semibold text-bg"
                    to="/sign-in"
                >
                    Get started
                </Link>
            </div>
        </nav>
    );
}

function CategoryLinks() {
    const navigate = useNavigate();

    let category: string = 'all';
    try {
        const search = useSearch({ from: '/blog/' });
        category = (search as { category?: string }).category ?? 'all';
    } catch {
        // not on index route
    }

    return (
        <div className="hidden gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
                const active = category === item.category;
                return (
                    <button
                        className={cn(
                            'rounded-lg px-3 py-1.5 font-mono text-[12.5px] transition-colors',
                            active ? 'bg-elev-2 text-fg' : 'text-muted hover:text-fg',
                        )}
                        key={item.category}
                        onClick={() =>
                            navigate({
                                search: { category: item.category, layout: 'grid' },
                                to: '/blog',
                            })
                        }
                        type="button"
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
