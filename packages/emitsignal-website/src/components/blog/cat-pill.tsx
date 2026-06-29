import type { PostCategory } from '#/lib/blog';

import { CATEGORIES } from '#/lib/blog';
import { cn } from '#/lib/cn';

interface CatPillProps {
    category: PostCategory;
    className?: string;
    size?: 'md' | 'sm';
}

export function CatPill({ category, className, size = 'md' }: CatPillProps) {
    const { color, label } = CATEGORIES[category] ?? {};

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border font-mono font-semibold',
                size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-3 py-1 text-[11.5px]',
                className,
            )}
            style={{
                background: color + '11',
                borderColor: color + '44',
                color: color,
            }}
        >
            <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: color, boxShadow: `0 0 7px ${color}` }}
            />

            {label}
        </span>
    );
}
