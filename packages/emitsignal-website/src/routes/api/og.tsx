import { Resvg } from '@resvg/resvg-js';
import { createFileRoute } from '@tanstack/react-router';
import satori from 'satori';

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
                color: '#08080a',
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
                background: '#08080a',
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
                background: '#08080a',
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
                        color: '#08080a',
                        display: 'flex',
                        fontFamily: 'Inter',
                        fontSize: 18,
                        fontWeight: 500,
                        gap: 10,
                        position: 'relative',
                    }}
                >
                    <PulseMark color="#08080a" size={22} />
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
                            color: '#08080a',
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
                const Card = template === 'field' ? FieldCard : EditorialCard;

                const fonts = await loadFonts();

                const svg = await satori(<Card {...props} />, {
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
