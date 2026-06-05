interface TemplateStringProps {
    size?: number;
    str: string;
}

export function applyTemplate(str: string, data: Record<string, unknown>): string {
    return str.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, path: string) => {
        const val = path
            .trim()
            .split('.')
            .reduce<unknown>(
                (o, k) =>
                    o != null && typeof o === 'object'
                        ? (o as Record<string, unknown>)[k]
                        : undefined,
                data,
            );
        return val == null ? '—' : String(val);
    });
}

export function TemplateString({ size = 12.5, str }: TemplateStringProps) {
    const parts = String(str).split(/(\{\{[^}]+\}\})/g);
    return (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: size }}>
            {parts.map((p, i) =>
                p.startsWith('{{') ? (
                    <span
                        className="rounded px-0.5 text-accent"
                        key={i}
                        style={{
                            background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                        }}
                    >
                        {p}
                    </span>
                ) : (
                    <span className="text-fg" key={i}>
                        {p}
                    </span>
                ),
            )}
        </span>
    );
}
