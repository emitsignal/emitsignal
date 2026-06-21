interface JsonViewProps {
    data: unknown;
    size?: number;
}

interface Token {
    text: string;
    type: TokenType;
}

type TokenType = 'key' | 'keyword' | 'number' | 'punctuation' | 'string';

// Theme-aware tokens — these CSS variables resolve to darker, higher-contrast
// values under [data-theme='light'] (see src/styles.css).
const COLOR: Record<TokenType, string> = {
    key: 'var(--color-info)',
    keyword: 'var(--color-accent)',
    number: 'var(--color-warn)',
    punctuation: 'var(--color-dim)',
    string: 'var(--color-success)',
};

export function JsonView({ data, size = 12 }: JsonViewProps) {
    const raw = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const tokens = tokenize(raw);

    return (
        <pre
            className="m-0 whitespace-pre-wrap break-words leading-relaxed"
            style={{ fontFamily: 'var(--font-mono)', fontSize: size }}
        >
            {tokens.map((token, index) => (
                <span key={index} style={{ color: COLOR[token.type] }}>
                    {token.text}
                </span>
            ))}
        </pre>
    );
}

function tokenize(raw: string): Token[] {
    const tokens: Token[] = [];
    const re =
        /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    let last = 0;
    let m: null | RegExpExecArray;

    while ((m = re.exec(raw)) !== null) {
        if (m.index > last) tokens.push({ text: raw.slice(last, m.index), type: 'punctuation' });
        if (m[1] !== undefined) {
            if (m[2] !== undefined) {
                tokens.push({ text: m[1], type: 'key' });
                tokens.push({ text: m[2], type: 'punctuation' });
            } else {
                tokens.push({ text: m[1], type: 'string' });
            }
        } else if (m[3] !== undefined) {
            tokens.push({ text: m[3], type: 'keyword' });
        } else if (m[4] !== undefined) {
            tokens.push({ text: m[4], type: 'number' });
        }
        last = re.lastIndex;
    }

    if (last < raw.length) tokens.push({ text: raw.slice(last), type: 'punctuation' });
    return tokens;
}
