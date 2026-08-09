import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Logo } from '#/components/ui/logo';
import { cn } from '#/lib/cn';

/** Distance scrolled before the bar earns its background. Roughly one nav height. */
const SOLID_AFTER_PX = 32;

interface SiteNavProps {
    children?: React.ReactNode;
    variant?: 'floating' | 'pinned';
}

interface SiteNavWordmarkProps {
    section?: React.ReactNode;
}

export function SiteNav({ children, variant = 'floating' }: SiteNavProps) {
    const scrolled = useScrolledPast(SOLID_AFTER_PX);
    const solid = variant === 'pinned' || scrolled;

    return (
        <header
            className={cn(
                'z-50 border-b transition-colors duration-300',
                variant === 'floating' ? 'fixed inset-x-0 top-0' : 'sticky top-0',
                solid
                    ? 'border-line bg-bg/45 backdrop-blur-sm'
                    : 'border-transparent bg-transparent',
            )}
        >
            <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-5 md:px-12">
                {children}

                <div className="ml-auto flex items-center gap-4 font-mono text-[12px]">
                    <Link
                        className="text-muted no-underline transition-colors hover:text-fg"
                        to="/sign-in"
                    >
                        Sign in
                    </Link>

                    <Link
                        className="rounded-lg bg-accent px-3.5 py-2 font-semibold text-bg no-underline transition-colors hover:bg-accent-hover active:translate-y-px"
                        to="/sign-in"
                    >
                        Get started
                    </Link>
                </div>
            </div>
        </header>
    );
}

export function SiteNavWordmark({ section }: SiteNavWordmarkProps) {
    if (!section) {
        return (
            <Link className="no-underline" to="/">
                <Logo pulse size={16} />
            </Link>
        );
    }

    return (
        <span className="flex items-center gap-2 font-mono text-[12.5px]">
            <Link className="no-underline" to="/">
                <Logo size={16} />
            </Link>
            <span className="text-faint">/</span>
            {section}
        </span>
    );
}

function useScrolledPast(offset: number): boolean {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > offset);

        // Run once: a reload part-way down the page starts already scrolled.
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, [offset]);

    return scrolled;
}
