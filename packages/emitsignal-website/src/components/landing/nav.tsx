import type { ReactNode } from 'react';

import { Link } from '@tanstack/react-router';

import { Avatar } from '#/components/ui/avatar';
import { Logo } from '#/components/ui/logo';
import { useSession } from '#/ctx/session';

interface NavLink {
    href: string;
    label: ReactNode;
}

const LINKS: NavLink[] = [
    { href: '#how', label: 'Docs' },
    { href: '#surfaces', label: 'CLI' },
    { href: '#pricing', label: 'Pricing' },
    {
        href: '#',
        label: (
            <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]" />
                Status
            </span>
        ),
    },
    { href: '#', label: 'Changelog' },
];

export function Nav() {
    const { user } = useSession();

    return (
        <nav className="sticky top-0 z-10 flex items-center gap-7 border-b border-line bg-bg/85 px-8 py-3.5 font-mono text-[12.5px] backdrop-blur-md">
            <Link className="text-fg no-underline" to="/">
                <Logo pulse />
            </Link>
            <div className="ml-4 flex gap-[22px]">
                {LINKS.map((link, index) => (
                    <a
                        className="text-muted no-underline hover:text-fg"
                        href={link.href}
                        key={index}
                    >
                        {link.label}
                    </a>
                ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
                {user ? (
                    <>
                        <Link
                            className="flex items-center gap-2 text-muted no-underline hover:text-fg"
                            to="/app"
                        >
                            <Avatar name={user.email} rounded={100} size={22} />
                            <span>Dashboard</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link className="text-muted no-underline hover:text-fg" to="/sign-in">
                            Sign in
                        </Link>
                        <Link
                            className="rounded-md bg-accent px-3.5 py-1.5 font-semibold text-bg no-underline hover:bg-accent-dim"
                            to="/sign-in"
                        >
                            Get started
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
