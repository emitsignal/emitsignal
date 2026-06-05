interface JsonViewProps {
    data: unknown;
    size?: number;
}

interface Token {
    s: string;
    t: TokenType;
}

type TokenType = 'key' | 'kw' | 'num' | 'p' | 'str';

const COLOR: Record<TokenType, string> = {
    key: '#67e8f9',
    kw: '#fbbf24',
    num: '#fbbf24',
    p: '#7a6d99',
    str: '#4ade80',
};

export function JsonView({ data, size = 12 }: JsonViewProps) {
    const raw = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const tokens = tokenize(raw);

    return (
        <pre
            className="m-0 whitespace-pre-wrap break-words leading-relaxed"
            style={{ fontFamily: 'var(--font-mono)', fontSize: size }}
        >
            {tokens.map((tk, i) => (
                <span key={i} style={{ color: COLOR[tk.t] }}>
                    {tk.s}
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
        if (m.index > last) tokens.push({ s: raw.slice(last, m.index), t: 'p' });
        if (m[1] !== undefined) {
            if (m[2] !== undefined) {
                tokens.push({ s: m[1], t: 'key' });
                tokens.push({ s: m[2], t: 'p' });
            } else {
                tokens.push({ s: m[1], t: 'str' });
            }
        } else if (m[3] !== undefined) {
            tokens.push({ s: m[3], t: 'kw' });
        } else if (m[4] !== undefined) {
            tokens.push({ s: m[4], t: 'num' });
        }
        last = re.lastIndex;
    }

    if (last < raw.length) tokens.push({ s: raw.slice(last), t: 'p' });
    return tokens;
}
