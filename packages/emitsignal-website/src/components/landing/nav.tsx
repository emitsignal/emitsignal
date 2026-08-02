import { Link } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { Logo } from '#/components/ui/logo';
import { DOCS_URL } from '#/lib/links';

interface NavLink {
    href?: string;
    label: string;
    to?: string;
}

const LINKS: NavLink[] = [
    { label: 'Blog', to: '/blog' },
    { href: DOCS_URL, label: 'Docs' },
    { href: '#pricing', label: 'Pricing' },
    { label: 'Changelog', to: '/changelog' },
];

const LINK_CLASS = 'text-muted no-underline hover:text-fg';

export function Nav() {
    const [open, setOpen] = useState(false);

    const close = () => setOpen(false);

    return (
        <nav className="sticky top-0 z-10 border-b border-line bg-bg/85 font-mono text-[12.5px] backdrop-blur-md">
            <div className="flex items-center gap-4 px-4 py-3.5 sm:gap-7 sm:px-8">
                <Link className="text-fg no-underline" onClick={close} to="/">
                    <Logo pulse />
                </Link>

                <div className="ml-4 hidden gap-[22px] md:flex">
                    <NavLinks />
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <Link
                        className="hidden text-muted no-underline hover:text-fg sm:inline"
                        to="/sign-in"
                    >
                        Sign in
                    </Link>

                    <Link
                        className="rounded-lg bg-accent px-3.5 py-1.5 font-semibold text-bg no-underline hover:bg-accent-hover active:translate-y-px"
                        to="/sign-in"
                    >
                        Get started
                    </Link>

                    <button
                        aria-controls="nav-menu"
                        aria-expanded={open}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        className="-mr-1 cursor-pointer border-none bg-transparent p-1 text-muted hover:text-fg md:hidden"
                        onClick={() => setOpen(!open)}
                        type="button"
                    >
                        {open ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </div>

            {open && (
                <div
                    className="flex flex-col gap-4 border-t border-line px-4 pb-5 pt-4 md:hidden"
                    id="nav-menu"
                >
                    <NavLinks onNavigate={close} />
                    <Link className={`${LINK_CLASS} sm:hidden`} onClick={close} to="/sign-in">
                        Sign in
                    </Link>
                </div>
            )}
        </nav>
    );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return LINKS.map((link) =>
        link.to ? (
            <Link className={LINK_CLASS} key={link.label} onClick={onNavigate} to={link.to}>
                {link.label}
            </Link>
        ) : (
            <a className={LINK_CLASS} href={link.href} key={link.label} onClick={onNavigate}>
                {link.label}
            </a>
        ),
    );
}
