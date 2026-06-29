import { useEffect, useState } from 'react';

import type { PostHeading } from '#/lib/blog';

interface BlogTocProps {
    headings: PostHeading[];
    slug: string;
}

export function BlogToc({ headings, slug }: BlogTocProps) {
    const [activeId, setActiveId] = useState(headings[0]?.id ?? '');

    useEffect(() => {
        if (headings.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                }
            },
            { rootMargin: '-80px 0% -70% 0%', threshold: 0 },
        );

        for (const h of headings) {
            const el = document.getElementById(h.id);
            if (el) {
                observer.observe(el);
            }
        }

        return () => observer.disconnect();
    }, [headings, slug]);

    if (headings.length === 0) {
        return null;
    }

    return (
        <aside className="sticky top-20 self-start">
            <div className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[1.8px] text-dim">
                On this page
            </div>

            <nav className="flex flex-col gap-0.5 border-l border-line">
                {headings.map((heading) => {
                    const active = activeId === heading.id;

                    return (
                        <button
                            className="border-l-2 py-1.5 pl-3.5 text-left font-sans text-[13px] leading-[1.4] transition-colors cursor-pointer"
                            key={heading.id}
                            onClick={() => jumpTo(heading.id)}
                            style={{
                                borderLeftColor: active ? 'var(--color-accent)' : 'transparent',
                                color: active ? 'var(--color-fg)' : 'var(--color-muted)',
                                fontWeight: active ? 600 : 400,
                                marginLeft: -1,
                            }}
                            type="button"
                        >
                            {heading.text}
                        </button>
                    );
                })}
            </nav>

            <div className="mt-5 flex flex-col gap-2.5 border-t border-line pt-4">
                <ShareButton label="Copy link" />
                <ShareButton label="Discuss on GitHub" />
            </div>
        </aside>
    );
}

function jumpTo(id: string) {
    const element = document.getElementById(id);

    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function ShareButton({ label }: { label: string }) {
    const [hit, setHit] = useState(false);

    return (
        <button
            className="cursor-pointer flex items-center gap-2 font-mono text-[12px] text-muted transition-colors hover:text-accent"
            onClick={() => {
                if (label === 'Copy link') {
                    navigator.clipboard?.writeText(window.location.href);
                }

                setHit(true);
                setTimeout(() => setHit(false), 1200);
            }}
            style={{ color: hit ? 'var(--color-accent)' : undefined }}
            type="button"
        >
            {hit ? '✓ done' : label}
        </button>
    );
}
