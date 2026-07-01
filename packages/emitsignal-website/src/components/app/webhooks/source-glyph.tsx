export type WebhookSource = 'custom' | 'github' | 'grafana' | 'stripe' | 'vercel';

const SOURCE_CONFIG: Record<WebhookSource, { color: string; glyph: string; label: string }> = {
    custom: { color: 'var(--color-info)', glyph: '{}', label: 'Custom' },
    github: { color: 'var(--color-fg)', glyph: 'GH', label: 'GitHub' },
    grafana: { color: 'var(--color-warn)', glyph: 'GF', label: 'Grafana' },
    stripe: { color: 'var(--color-accent)', glyph: 'ST', label: 'Stripe' },
    vercel: { color: 'var(--color-fg)', glyph: 'VC', label: 'Vercel' },
};

interface SourceGlyphProps {
    size?: number;
    source: string;
}

export function SourceGlyph({ size = 34, source }: SourceGlyphProps) {
    const config = SOURCE_CONFIG[source as WebhookSource] ?? SOURCE_CONFIG.custom;

    return (
        <div
            className="flex shrink-0 items-center justify-center rounded-lg border border-line bg-elev-2 font-mono font-bold"
            style={{ color: config.color, fontSize: size * 0.36, height: size, width: size }}
        >
            {config.glyph}
        </div>
    );
}

export { SOURCE_CONFIG };
