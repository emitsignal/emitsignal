import type { ReactNode } from 'react';

import { Link } from '@tanstack/react-router';

import { Logo } from '#/components/ui/logo';

interface NavLink {
    href?: string;
    label: ReactNode;
    to?: string;
}

const LINKS: NavLink[] = [
    { label: 'Blog', to: '/blog' },
    { href: '#how', label: 'Docs' },
    { href: '#pricing', label: 'Pricing' },
    { href: '/changelog', label: 'Changelog' },
];

export function Nav() {
    return (
        <nav className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-bg/85 px-4 py-3.5 font-mono text-[12.5px] backdrop-blur-md sm:gap-7 sm:px-8">
            <Link className="text-fg no-underline" to="/">
                <Logo pulse />
            </Link>
            <div className="ml-4 hidden gap-[22px] md:flex">
                {LINKS.map((link, index) =>
                    link.to ? (
                        <Link
                            className="text-muted no-underline hover:text-fg"
                            key={index}
                            to={link.to}
                        >
                            {link.label}
                        </Link>
                    ) : (
                        <a
                            className="text-muted no-underline hover:text-fg"
                            href={link.href}
                            key={index}
                        >
                            {link.label}
                        </a>
                    ),
                )}
            </div>

            <div className="ml-auto flex items-center gap-3">
                <Link
                    className="hidden text-muted no-underline hover:text-fg sm:inline"
                    to="/sign-in"
                >
                    Sign in
                </Link>

                <Link
                    className="rounded-md bg-accent px-3.5 py-1.5 font-semibold text-bg no-underline hover:bg-accent-dim"
                    to="/sign-in"
                >
                    Get started
                </Link>
            </div>
        </nav>
    );
}
