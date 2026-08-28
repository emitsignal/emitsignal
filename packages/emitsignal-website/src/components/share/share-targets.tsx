import { Linkedin, Mail, MessageCircle, Twitter } from 'lucide-react';

import { cn } from '#/lib/cn';

interface ShareTargetsProps {
    className?: string;
    title: string;
    url: string;
}

/**
 * Plain intent links — no SDKs, no trackers. Every target opens in a new tab and
 * carries the full share URL, so the recipient lands on the same public page.
 */
export function ShareTargets({ className, title, url }: ShareTargetsProps) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const targets = [
        {
            href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
            icon: MessageCircle,
            label: 'WhatsApp',
        },
        {
            href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
            icon: Twitter,
            label: 'X',
        },
        {
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            icon: Linkedin,
            label: 'LinkedIn',
        },
        {
            href: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`${title}\n\n${url}`)}`,
            icon: Mail,
            label: 'Email',
        },
    ];

    return (
        <div className={cn('flex gap-2', className)}>
            {targets.map(({ href, icon: Icon, label }) => (
                <a
                    aria-label={`Share on ${label}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-elev text-muted no-underline hover:border-faint hover:bg-elev-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    href={href}
                    key={label}
                    rel="noopener noreferrer"
                    target="_blank"
                    title={`Share on ${label}`}
                >
                    <Icon size={15} />
                </a>
            ))}
        </div>
    );
}
