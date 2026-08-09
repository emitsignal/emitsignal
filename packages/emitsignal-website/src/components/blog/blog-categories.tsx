import { useNavigate, useSearch } from '@tanstack/react-router';

import type { PostCategory } from '#/lib/blog';

import { cn } from '#/lib/cn';

const NAV_ITEMS: Array<{ category: 'all' | PostCategory; label: string }> = [
    { category: 'all', label: 'All' },
    { category: 'product', label: 'Product' },
    { category: 'engineering', label: 'Engineering' },
    { category: 'tutorial', label: 'Integrations' },
    { category: 'changelog', label: 'Changelog' },
];

export function BlogCategories() {
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
