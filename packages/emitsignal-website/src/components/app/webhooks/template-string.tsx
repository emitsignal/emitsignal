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
                (accumulator, key) =>
                    accumulator != null && typeof accumulator === 'object'
                        ? (accumulator as Record<string, unknown>)[key]
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
            {parts.map((part, index) =>
                part.startsWith('{{') ? (
                    <span
                        className="rounded px-0.5 text-accent"
                        key={index}
                        style={{
                            background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                        }}
                    >
                        {part}
                    </span>
                ) : (
                    <span className="text-fg" key={index}>
                        {part}
                    </span>
                ),
            )}
        </span>
    );
}
