import { applyTemplate as applyTemplateShared } from '@emitsignal/shared/webhook-template';

interface TemplateStringProps {
    size?: number;
    str: string;
}

// Preview wrapper: renders missing values as an em dash so the UI shows a placeholder.
export function applyTemplate(
    str: string,
    data: Record<string, unknown>,
    replacements?: Record<string, string>,
): string {
    return applyTemplateShared(str, data, { defaultValue: '—', replacements });
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
