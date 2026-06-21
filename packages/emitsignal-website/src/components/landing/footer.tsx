import { Link } from '@tanstack/react-router';

import { Logo } from '#/components/ui/logo';

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
            { label: 'CLI', to: '/cli' },
            { label: 'Web dashboard', to: '/dashboard' },
            { label: 'Mobile', to: '/mobile' },
            { label: 'API', to: '/api' },
            { label: 'Changelog', to: '/changelog' },
        ],
    },
    {
        heading: 'developers',
        links: [
            { href: '#how', label: 'Docs' },
            { href: '#how', label: 'Quickstart' },
            { href: '#', label: 'Reference' },
            { href: '#use-cases', label: 'Examples' },
            { href: '#', label: 'Open source' },
        ],
    },
    {
        heading: 'legal',
        links: [
            { label: 'Privacy', to: '/privacy' },
            { label: 'Terms', to: '/terms' },
            { href: '#', label: 'Security' },
            { href: '#', label: 'SOC2' },
            { href: '#', label: 'DPA' },
        ],
    },
];

const SOCIAL_BADGES = ['gh', 'tw', 'rs', 'em'];

export function Footer() {
    return (
        <footer className="border-t border-line bg-[#0a0614] px-5 pb-8 pt-10 sm:px-8 md:px-16 md:pt-14">
            <div className="mx-auto max-w-[1280px]">
                <div className="mb-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:mb-12 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-10">
                    <div className="col-span-2 sm:col-span-3 md:col-span-1">
                        <Logo pulse size={16} />
                        <p className="mt-4 max-w-[280px] text-[13px] leading-[1.6] text-muted">
                            The dev-native pubsub layer.
                            <br />
                            One curl. Everywhere you read.
                        </p>
                        <div className="mt-4.5 flex gap-2.5">
                            {SOCIAL_BADGES.map((badge) => (
                                <a
                                    className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-elev font-mono text-[10px] text-muted no-underline hover:text-fg"
                                    href="#"
                                    key={badge}
                                >
                                    {badge}
                                </a>
                            ))}
                        </div>
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
                    <span>© 2026 EmitSignal Labs · made by humans, paged by computers</span>
                    <span className="flex items-center gap-1.5 sm:ml-auto">
                        <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]" />
                        all systems normal · status.emitsignal.com
                    </span>
                </div>
            </div>
        </footer>
    );
}
