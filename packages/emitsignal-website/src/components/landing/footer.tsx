import { Logo } from '#/components/ui/logo';

interface FooterColumn {
    heading: string;
    links: FooterLink[];
}

interface FooterLink {
    href: string;
    label: string;
}

const COLUMNS: FooterColumn[] = [
    {
        heading: 'product',
        links: [
            { href: '#surfaces', label: 'CLI' },
            { href: '/app', label: 'Web dashboard' },
            { href: '#surfaces', label: 'Mobile' },
            { href: '#how', label: 'API' },
            { href: '#', label: 'Changelog' },
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
        heading: 'company',
        links: [
            { href: '#', label: 'About' },
            { href: '#', label: 'Blog' },
            { href: '#', label: 'Careers' },
            { href: '#', label: 'Press kit' },
            { href: '#', label: 'Brand' },
        ],
    },
    {
        heading: 'legal',
        links: [
            { href: '#', label: 'Privacy' },
            { href: '#', label: 'Terms' },
            { href: '#', label: 'Security' },
            { href: '#', label: 'SOC2' },
            { href: '#', label: 'DPA' },
        ],
    },
];

const SOCIAL_BADGES = ['gh', 'tw', 'rs', 'em'];

export function Footer() {
    return (
        <footer className="border-t border-line bg-[#0a0614] px-16 pb-8 pt-14">
            <div className="mx-auto max-w-[1280px]">
                <div className="mb-12 grid grid-cols-[1.4fr_repeat(4,1fr)] gap-10">
                    <div>
                        <Logo pulse size={16} />
                        <p className="mt-4 max-w-[280px] text-[13px] leading-[1.6] text-muted">
                            The dev-native pubsub layer.
                            <br />
                            One curl. Everywhere you read.
                        </p>
                        <div className="mt-4.5 flex gap-2.5">
                            {SOCIAL_BADGES.map((s) => (
                                <a
                                    className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-elev font-mono text-[10px] text-muted no-underline hover:text-fg"
                                    href="#"
                                    key={s}
                                >
                                    {s}
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
                                        <a
                                            className="text-[13px] text-muted no-underline hover:text-fg"
                                            href={link.href}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-4 border-t border-line pt-5.5 font-mono text-[11px] text-dim">
                    <span>© 2026 EmitSignal Labs · made by humans, paged by computers</span>
                    <span className="ml-auto flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]" />
                        all systems normal · status.emitsignal.com
                    </span>
                </div>
            </div>
        </footer>
    );
}
