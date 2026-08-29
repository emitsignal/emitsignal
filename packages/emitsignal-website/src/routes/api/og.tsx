import type { ReactElement } from 'react';

import { Resvg } from '@resvg/resvg-js';
import { createFileRoute } from '@tanstack/react-router';
import satori from 'satori';

import { hashTopicLevel, PRIORITY_HEX, priorityHex, priorityLabel } from '#/lib/priority';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardProps {
    author: string;
    category: string;
    date: string;
    description: string;
    readTime: number;
    title: string;
}

type FontEntry = { data: ArrayBuffer; name: string; weight: 400 | 700 };

interface SignalCardProps {
    date: string;
    description: string;
    priority: number;
    tags: string[];
    title: string;
    topic: string;
}

// ─── Category palette (mirrors lib/blog.ts PostCategory + design tokens) ─────

const CATS: Record<string, { blurb: string; color: string; label: string }> = {
    changelog: {
        blurb: 'Every release, every line, dated.',
        color: '#4ade80',
        label: 'Changelog',
    },
    engineering: {
        blurb: 'How the pipe is built — deep dives from the team.',
        color: '#67e8f9',
        label: 'Engineering',
    },
    product: {
        blurb: 'New capabilities and the thinking behind them.',
        color: '#a78bfa',
        label: 'Product',
    },
    tutorial: {
        blurb: 'Wire a source to a sink in five minutes.',
        color: '#fbbf24',
        label: 'Integrations',
    },
};

const DEFAULT_CAT = CATS.product;

// ─── Font loading ─────────────────────────────────────────────────────────────

let fontsCache: FontEntry[] | null = null;

function adaptiveTitleSize(title: string, base: number, min: number): number {
    const n = title.length;
    if (n <= 30) return base;
    if (n <= 46) return base - 8;
    if (n <= 62) return base - 14;
    return min;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function AuthorAvatar({ color, name, size }: { color: string; name: string; size: number }) {
    return (
        <div
            style={{
                alignItems: 'center',
                background: `linear-gradient(180deg, ${color}, ${color}77)`,
                borderRadius: '50%',
                color: '#000000',
                display: 'flex',
                flexShrink: 0,
                fontSize: size * 0.38,
                fontWeight: 700,
                height: size,
                justifyContent: 'center',
                letterSpacing: -0.5,
                width: size,
            }}
        >
            {avatarInitials(name)}
        </div>
    );
}

function avatarInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function bounded(value: null | string, max: number) {
    return value === null ? null : value.slice(0, max);
}

// ══════════════════════════════════════════════════════════════════════════════
// A · EDITORIAL
// Title-forward, category kicker + top-right glow, author byline footer.
// Default template — category color does the visual differentiating per post.
// ══════════════════════════════════════════════════════════════════════════════
function EditorialCard({ author, category, date, readTime, title }: CardProps) {
    const cat = CATS[category] ?? DEFAULT_CAT;
    const fs = adaptiveTitleSize(title, 62, 44);

    return (
        <div
            style={{
                background: '#000000',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                padding: '54px 64px',
                position: 'relative',
                width: '100%',
            }}
        >
            {/* Category glow — top-right */}
            <div
                style={{
                    background: `radial-gradient(circle, ${cat.color} 0%, transparent 68%)`,
                    height: 620,
                    left: '56%',
                    opacity: 0.35,
                    position: 'absolute',
                    top: '-120px',
                    width: 620,
                }}
            />

            {/* Dot grid texture */}
            <div
                style={{
                    backgroundImage: `radial-gradient(#232427 1px, transparent 1px)`,
                    backgroundSize: '26px 26px',
                    height: '100%',
                    left: 0,
                    opacity: 0.5,
                    position: 'absolute',
                    top: 0,
                    width: '100%',
                }}
            />

            {/* Top bar */}
            <div
                style={{
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'space-between',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        alignItems: 'center',
                        color: '#f7f7f8',
                        display: 'flex',
                        fontFamily: 'Inter',
                        fontSize: 20,
                        fontWeight: 500,
                        gap: 12,
                        letterSpacing: -0.5,
                    }}
                >
                    <PulseMark color="#a78bfa" size={26} />
                    <span>emitsignal</span>
                </div>
                <span
                    style={{
                        color: '#71717a',
                        fontFamily: 'Inter',
                        fontSize: 16,
                        letterSpacing: 0.5,
                    }}
                >
                    emitsignal.com/blog
                </span>
            </div>

            {/* Center: kicker + title */}
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    gap: 22,
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
                    <div
                        style={{
                            backgroundColor: cat.color,
                            borderRadius: '50%',
                            height: 9,
                            width: 9,
                        }}
                    />
                    <span
                        style={{
                            color: cat.color,
                            fontFamily: 'Inter',
                            fontSize: 15,
                            fontWeight: 700,
                            letterSpacing: 2.5,
                            textTransform: 'uppercase',
                        }}
                    >
                        {cat.label}
                    </span>
                </div>

                <div
                    style={{
                        color: '#f7f7f8',
                        fontFamily: 'Inter',
                        fontSize: fs,
                        fontWeight: 700,
                        letterSpacing: -1.8,
                        lineHeight: 1.06,
                        maxWidth: 1000,
                    }}
                >
                    {title}
                </div>
            </div>

            {/* Footer: author byline */}
            <div
                style={{
                    alignItems: 'center',
                    borderTop: '1px solid #232427',
                    display: 'flex',
                    gap: 16,
                    paddingTop: 22,
                    position: 'relative',
                }}
            >
                <AuthorAvatar color={cat.color} name={author} size={48} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span
                        style={{
                            color: '#f7f7f8',
                            fontFamily: 'Inter',
                            fontSize: 20,
                            fontWeight: 700,
                        }}
                    >
                        {author}
                    </span>
                    <span style={{ color: '#71717a', fontFamily: 'Inter', fontSize: 14 }}>
                        {readTime} min read · {fmtDate(date)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// B · FIELD
// Bold category-color panel left, title + excerpt + byline on the dark right.
// Maximum per-category visual differentiation. Inspired by Slack link-preview.
// ══════════════════════════════════════════════════════════════════════════════
function FieldCard({ author, category, date, description, readTime, title }: CardProps) {
    const cat = CATS[category] ?? DEFAULT_CAT;
    const fs = adaptiveTitleSize(title, 50, 36);

    return (
        <div
            style={{
                background: '#000000',
                display: 'flex',
                height: '100%',
                overflow: 'hidden',
                width: '100%',
            }}
        >
            {/* Left color panel */}
            <div
                style={{
                    background: `linear-gradient(155deg, ${cat.color}, ${cat.color}aa 55%, ${cat.color}66)`,
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    padding: '52px 44px',
                    position: 'relative',
                    width: 380,
                }}
            >
                {/* Decorative concentric rings — bottom-right of panel */}
                <div
                    style={{
                        border: '2px solid rgba(12,7,22,0.15)',
                        borderRadius: '50%',
                        bottom: -120,
                        height: 340,
                        position: 'absolute',
                        right: -120,
                        width: 340,
                    }}
                />
                <div
                    style={{
                        border: '2px solid rgba(12,7,22,0.15)',
                        borderRadius: '50%',
                        bottom: -60,
                        height: 220,
                        position: 'absolute',
                        right: -60,
                        width: 220,
                    }}
                />

                {/* Logo */}
                <div
                    style={{
                        alignItems: 'center',
                        color: '#000000',
                        display: 'flex',
                        fontFamily: 'Inter',
                        fontSize: 18,
                        fontWeight: 500,
                        gap: 10,
                        position: 'relative',
                    }}
                >
                    <PulseMark color="#000000" size={22} />
                    <span>emitsignal</span>
                </div>

                {/* Category block */}
                <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <span
                        style={{
                            color: 'rgba(12,7,22,0.55)',
                            fontFamily: 'Inter',
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: 3,
                            textTransform: 'uppercase',
                        }}
                    >
                        Category
                    </span>
                    <span
                        style={{
                            color: '#000000',
                            fontFamily: 'Inter',
                            fontSize: 50,
                            fontWeight: 700,
                            letterSpacing: -1.5,
                            lineHeight: 1,
                            marginTop: 8,
                        }}
                    >
                        {cat.label}
                    </span>
                    <span
                        style={{
                            color: 'rgba(12,7,22,0.7)',
                            fontFamily: 'Inter',
                            fontSize: 15,
                            lineHeight: 1.4,
                            marginTop: 14,
                        }}
                    >
                        {cat.blurb}
                    </span>
                </div>
            </div>

            {/* Right dark panel */}
            <div
                style={{
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    gap: 20,
                    justifyContent: 'center',
                    padding: '52px 56px',
                    position: 'relative',
                }}
            >
                {/* Subtle glow */}
                <div
                    style={{
                        background: `radial-gradient(circle, ${cat.color} 0%, transparent 68%)`,
                        height: 520,
                        opacity: 0.22,
                        position: 'absolute',
                        right: '-15%',
                        top: '-25%',
                        width: 520,
                    }}
                />

                <div
                    style={{
                        color: '#f7f7f8',
                        fontFamily: 'Inter',
                        fontSize: fs,
                        fontWeight: 700,
                        letterSpacing: -1.4,
                        lineHeight: 1.08,
                        position: 'relative',
                    }}
                >
                    {title}
                </div>

                <div
                    style={{
                        color: '#a1a1a6',
                        fontFamily: 'Inter',
                        fontSize: 18,
                        lineHeight: 1.5,
                        maxWidth: 620,
                        position: 'relative',
                    }}
                >
                    {truncate(description, 130)}
                </div>

                {/* Byline */}
                <div
                    style={{
                        alignItems: 'center',
                        display: 'flex',
                        gap: 14,
                        marginTop: 8,
                        position: 'relative',
                    }}
                >
                    <AuthorAvatar color={cat.color} name={author} size={42} />
                    <span
                        style={{
                            color: '#f7f7f8',
                            fontFamily: 'Inter',
                            fontSize: 18,
                            fontWeight: 700,
                        }}
                    >
                        {author}
                    </span>
                    <div
                        style={{
                            backgroundColor: '#3f3f46',
                            borderRadius: '50%',
                            height: 4,
                            width: 4,
                        }}
                    />
                    <span style={{ color: '#71717a', fontFamily: 'Inter', fontSize: 14 }}>
                        {readTime} min read · {fmtDate(date)}
                    </span>
                </div>
            </div>
        </div>
    );
}

function fmtDate(iso: string): string {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function loadFonts(): Promise<FontEntry[]> {
    if (fontsCache) return fontsCache;

    const fetchGoogleFont = async (weight: 400 | 700): Promise<ArrayBuffer> => {
        const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`, {
            headers: { 'User-Agent': 'Mozilla/4.0' },
        }).then((r) => r.text());
        const url = css.match(/url\(([^)]+)\)/)?.[1];
        if (!url) throw new Error(`Inter ${weight} font URL not found`);
        return fetch(url).then((r) => r.arrayBuffer());
    };

    const [regular, bold] = await Promise.all([fetchGoogleFont(400), fetchGoogleFont(700)]);

    fontsCache = [
        { data: regular, name: 'Inter', weight: 400 },
        { data: bold, name: 'Inter', weight: 700 },
    ];

    return fontsCache;
}

function PulseMark({ color, size }: { color: string; size: number }) {
    return (
        <div
            style={{
                alignItems: 'center',
                display: 'flex',
                flexShrink: 0,
                height: size,
                justifyContent: 'center',
                position: 'relative',
                width: size,
            }}
        >
            <div
                style={{
                    border: `${Math.max(1, Math.round(size * 0.02))}px solid ${color}`,
                    borderRadius: '50%',
                    height: size,
                    opacity: 0.18,
                    position: 'absolute',
                    width: size,
                }}
            />
            <div
                style={{
                    border: `${Math.max(1, Math.round(size * 0.025))}px solid ${color}`,
                    borderRadius: '50%',
                    height: size * 0.65,
                    opacity: 0.38,
                    position: 'absolute',
                    width: size * 0.65,
                }}
            />
            <div
                style={{
                    backgroundColor: color,
                    borderRadius: '50%',
                    height: size * 0.3,
                    width: size * 0.3,
                }}
            />
        </div>
    );
}

function renderCard(
    template: string,
    props: CardProps,
    searchParameters: URLSearchParams,
): ReactElement {
    if (template === 'signal') {
        return (
            <SignalCard
                date={props.date}
                description={props.description}
                priority={Math.min(
                    5,
                    Math.max(1, Number(searchParameters.get('priority') ?? '3') || 3),
                )}
                tags={(bounded(searchParameters.get('tags'), 120) ?? '')
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean)}
                title={props.title}
                topic={bounded(searchParameters.get('topic'), 60) ?? props.category}
            />
        );
    }

    if (template === 'field') {
        return <FieldCard {...props} />;
    }

    return <EditorialCard {...props} />;
}

function SignalCard({ date, description, priority, tags, title, topic }: SignalCardProps) {
    const accent = priorityHex(priority);
    const topicColor = PRIORITY_HEX[hashTopicLevel(topic)];
    const fs = adaptiveTitleSize(title, 54, 38);

    return (
        <div
            style={{
                background: '#000000',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                padding: '46px 56px',
                position: 'relative',
                width: '100%',
            }}
        >
            {/* Priority glow — top-right */}
            <div
                style={{
                    background: `radial-gradient(circle, ${accent} 0%, transparent 68%)`,
                    height: 560,
                    left: '58%',
                    opacity: 0.28,
                    position: 'absolute',
                    top: '-180px',
                    width: 560,
                }}
            />

            {/* Dot grid texture */}
            <div
                style={{
                    backgroundImage: `radial-gradient(#232427 1px, transparent 1px)`,
                    backgroundSize: '26px 26px',
                    height: '100%',
                    left: 0,
                    opacity: 0.5,
                    position: 'absolute',
                    top: 0,
                    width: '100%',
                }}
            />

            {/* Top bar */}
            <div
                style={{
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'space-between',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        alignItems: 'center',
                        color: '#f7f7f8',
                        display: 'flex',
                        fontFamily: 'Inter',
                        fontSize: 20,
                        fontWeight: 500,
                        gap: 12,
                        letterSpacing: -0.5,
                    }}
                >
                    <PulseMark color="#a78bfa" size={26} />
                    <span>emitsignal</span>
                </div>
                <div
                    style={{
                        alignItems: 'center',
                        border: '1px solid #232427',
                        borderRadius: 999,
                        color: '#a1a1a6',
                        display: 'flex',
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: 700,
                        gap: 8,
                        letterSpacing: 2,
                        padding: '7px 14px',
                        textTransform: 'uppercase',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#4ade80',
                            borderRadius: '50%',
                            height: 7,
                            width: 7,
                        }}
                    />
                    Shared signal
                </div>
            </div>

            {/* The message card */}
            <div
                style={{
                    backgroundColor: '#0b0b0d',
                    border: '1px solid #232427',
                    borderRadius: 22,
                    display: 'flex',
                    flex: 1,
                    flexDirection: 'column',
                    marginTop: 30,
                    overflow: 'hidden',
                    padding: '34px 38px',
                    position: 'relative',
                }}
            >
                {/* Priority rail */}
                <div
                    style={{
                        backgroundColor: accent,
                        bottom: 0,
                        left: 0,
                        position: 'absolute',
                        top: 0,
                        width: 4,
                    }}
                />

                {/* Topic row */}
                <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
                    <AuthorAvatar color={topicColor} name={topic} size={44} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span
                            style={{
                                color: '#f7f7f8',
                                fontFamily: 'Inter',
                                fontSize: 19,
                                fontWeight: 700,
                                letterSpacing: -0.3,
                            }}
                        >
                            {topic}
                        </span>
                        <span style={{ color: '#71717a', fontFamily: 'Inter', fontSize: 14 }}>
                            public topic · {fmtDate(date)}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flex: 1 }} />

                    <div
                        style={{
                            alignItems: 'center',
                            backgroundColor: `${accent}1f`,
                            border: `1px solid ${accent}59`,
                            borderRadius: 999,
                            color: accent,
                            display: 'flex',
                            fontFamily: 'Inter',
                            fontSize: 14,
                            fontWeight: 700,
                            gap: 8,
                            letterSpacing: 1.2,
                            padding: '8px 16px',
                            textTransform: 'uppercase',
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: accent,
                                borderRadius: '50%',
                                height: 8,
                                width: 8,
                            }}
                        />
                        p{priority} · {priorityLabel(priority)}
                    </div>
                </div>

                {/* Title + excerpt */}
                <div
                    style={{
                        display: 'flex',
                        flex: 1,
                        flexDirection: 'column',
                        gap: 16,
                        justifyContent: 'center',
                    }}
                >
                    <div
                        style={{
                            color: '#f7f7f8',
                            fontFamily: 'Inter',
                            fontSize: fs,
                            fontWeight: 700,
                            letterSpacing: -1.6,
                            lineHeight: 1.08,
                            maxWidth: 940,
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{
                            color: '#a1a1a6',
                            fontFamily: 'Inter',
                            fontSize: 19,
                            lineHeight: 1.5,
                            maxWidth: 900,
                        }}
                    >
                        {truncate(description, 150)}
                    </div>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: 10 }}>
                    {tags.slice(0, 4).map((tag) => (
                        <div
                            key={tag}
                            style={{
                                backgroundColor: '#111114',
                                border: '1px solid #232427',
                                borderRadius: 8,
                                color: '#a1a1a6',
                                display: 'flex',
                                fontFamily: 'Inter',
                                fontSize: 14,
                                padding: '6px 12px',
                            }}
                        >
                            #{tag}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    alignItems: 'center',
                    color: '#71717a',
                    display: 'flex',
                    fontFamily: 'Inter',
                    fontSize: 15,
                    justifyContent: 'space-between',
                    marginTop: 18,
                    position: 'relative',
                }}
            >
                <span>Subscribe for push, email, or a live terminal stream.</span>
                <span style={{ color: '#a78bfa' }}>es subscribe {topic}</span>
            </div>
        </div>
    );
}

function truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/api/og')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const { searchParams } = new URL(request.url);

                const props: CardProps = {
                    author: bounded(searchParams.get('author'), 80) ?? 'EmitSignal',
                    category: bounded(searchParams.get('category'), 40) ?? 'product',
                    date:
                        bounded(searchParams.get('date'), 40) ??
                        new Date().toISOString().slice(0, 10),
                    description:
                        bounded(searchParams.get('description'), 300) ??
                        'Engineering deep-dives, product updates, and tutorials.',
                    readTime: Math.min(
                        999,
                        Math.max(0, Number(searchParams.get('readTime') ?? '5') || 0),
                    ),
                    title: bounded(searchParams.get('title'), 120) ?? 'EmitSignal Blog',
                };

                const template = searchParams.get('template') ?? 'editorial';

                const card = renderCard(template, props, searchParams);

                const fonts = await loadFonts();

                const svg = await satori(card, {
                    fonts,
                    height: 630,
                    width: 1200,
                });

                const png = new Uint8Array(new Resvg(svg).render().asPng());

                return new Response(png, {
                    headers: {
                        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
                        'Content-Type': 'image/png',
                    },
                });
            },
        },
    },
});
