import { Link } from '@tanstack/react-router';
import { Github } from 'lucide-react';

import { Logo } from '#/components/ui/logo';
import { AUTHOR_URL, DOCS_URL, LICENSE_URL, REPO_URL, STATUS_URL } from '#/lib/links';

interface FooterColumn {
    heading: string;
    links: FooterLink[];
}

interface FooterLink {
    href?: string;
    label: string;
    to?: string;
}

const COLUMNS: FooterColumn[] = [
    {
        heading: 'product',
        links: [
            { label: 'Mobile', to: '/mobile' },
            { href: `${DOCS_URL}/api`, label: 'API' },
            { label: 'Changelog', to: '/changelog' },
        ],
    },
    {
        heading: 'developers',
        links: [
            { href: DOCS_URL, label: 'Docs' },
            { label: 'Blog', to: '/blog' },
            { href: '/#open-source', label: 'Open source' },
        ],
    },
    {
        heading: 'legal',
        links: [
            { label: 'Privacy', to: '/privacy' },
            { label: 'Terms', to: '/terms' },
            { label: 'Code of conduct', to: '/code-of-conduct' },
            {
                href: LICENSE_URL,
                label: 'AGPLv3 License',
            },
        ],
    },
];

export function Footer() {
    return (
        <footer className="border-t border-line bg-deep px-5 pb-8 pt-10 sm:px-8 md:px-16 md:pt-14">
            <div className="mx-auto max-w-[1280px]">
                <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:mb-12 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-10">
                    <div className="col-span-2 sm:col-span-3 md:col-span-1">
                        <Logo pulse size={16} />
                        <p className="mt-4 max-w-[280px] text-[13px] leading-[1.6] text-muted">
                            A pubsub layer for humans.
                            <br />
                            One curl. Everywhere you read.
                        </p>
                        <a
                            className="mt-4.5 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted no-underline hover:bg-elev hover:text-fg"
                            href={REPO_URL}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            <Github size={13} />
                            GitHub
                        </a>
                    </div>

                    {COLUMNS.map((col) => (
                        <div key={col.heading}>
                            <p className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[1.6px] text-dim">
                                {col.heading}
                            </p>

                            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        {link.to ? (
                                            <Link
                                                className="text-[13px] text-muted no-underline hover:text-fg"
                                                to={link.to}
                                            >
                                                {link.label}
                                            </Link>
                                        ) : (
                                            <a
                                                className="text-[13px] text-muted no-underline hover:text-fg"
                                                href={link.href}
                                                rel="noopener noreferrer"
                                                target={
                                                    link.href?.startsWith('http')
                                                        ? '_blank'
                                                        : undefined
                                                }
                                            >
                                                {link.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-2 border-t border-line pt-5.5 font-mono text-[11px] text-dim sm:flex-row sm:items-center sm:gap-4">
                    <span>
                        © {new Date().getFullYear()} EmitSignal. Built by{' '}
                        <a
                            className="text-muted hover:text-fg"
                            href={AUTHOR_URL}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Keven Leone
                        </a>
                    </span>
                    <span className="sm:ml-auto">
                        <a
                            className="text-muted hover:text-fg"
                            href={STATUS_URL}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            System status
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    );
}
