export type WebhookSource = 'custom' | 'github' | 'grafana' | 'stripe' | 'vercel';

const SOURCE_CONFIG: Record<WebhookSource, { color: string; glyph: string; label: string }> = {
    custom: { color: '#67e8f9', glyph: '{}', label: 'Custom' },
    github: { color: '#f5f0ff', glyph: 'GH', label: 'GitHub' },
    grafana: { color: '#fbbf24', glyph: 'GF', label: 'Grafana' },
    stripe: { color: '#a78bfa', glyph: 'ST', label: 'Stripe' },
    vercel: { color: '#f5f0ff', glyph: 'VC', label: 'Vercel' },
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
