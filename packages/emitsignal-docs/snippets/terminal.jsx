'use client';

// Simple, self-contained terminal components for Mintlify snippets.

export const Term = ({
    children,
    dense = false,
    pad = true,
    style,
    title = 'emitsignal — zsh',
}) => {
    return (
        <div style={{ margin: '16px 0' }}>
            <style>{'@keyframes esCaret { 50% { opacity: 0; } }'}</style>
            <div
                style={{
                    background: '#06030f',
                    border: '1px solid #2a2340',
                    borderRadius: 11,
                    boxShadow: '0 18px 50px -24px rgba(0,0,0,0.7)',
                    fontFamily: "'Geist Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace",
                    overflow: 'hidden',
                    ...style,
                }}
            >
                {/* macOS window chrome */}
                <div
                    style={{
                        alignItems: 'center',
                        background: '#1a1625',
                        borderBottom: '1px solid #2a2340',
                        display: 'flex',
                        gap: 7,
                        height: 34,
                        padding: '0 12px',
                    }}
                >
                    <span
                        style={{
                            background: '#ff5f57',
                            borderRadius: 99,
                            display: 'inline-block',
                            height: 11,
                            width: 11,
                        }}
                    />
                    <span
                        style={{
                            background: '#febc2e',
                            borderRadius: 99,
                            display: 'inline-block',
                            height: 11,
                            width: 11,
                        }}
                    />
                    <span
                        style={{
                            background: '#28c840',
                            borderRadius: 99,
                            display: 'inline-block',
                            height: 11,
                            width: 11,
                        }}
                    />
                    <span
                        style={{
                            color: '#7a6d99',
                            flex: 1,
                            fontFamily:
                                "'Geist Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace",
                            fontSize: 11.5,
                            marginLeft: -54,
                            textAlign: 'center',
                        }}
                    >
                        {title}
                    </span>
                </div>
                {/* Body */}
                <div
                    style={{
                        color: '#f5f0ff',
                        fontSize: 13,
                        lineHeight: dense ? 1.5 : 1.7,
                        overflowX: 'auto',
                        padding: pad ? '16px 18px' : 0,
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

// ── Syntax-highlighted command line ───────────────────────────

export const Cmd = ({ children, prompt = true, wrap = false }) => {
    const extractText = (node) => {
        if (node == null || node === false) return '';
        if (typeof node === 'string' || typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(extractText).join('');
        if (typeof node === 'object' && 'props' in node && node.props != null) {
            return extractText(node.props.children);
        }
        return '';
    };

    // Mintlify's MDX pipeline runs remark-smartypants over plain markdown text
    // (which is what <Cmd>...</Cmd> children are, unless authored as a JS expression),
    // rewriting straight quotes/dashes into typographic ones. That breaks copy-paste
    // into a shell, so undo it here — every substitution smartypants makes is
    // unambiguous to reverse in a shell-command context.
    const deSmarten = (str) =>
        str.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '--').replace(/…/g, '...');

    const tokenizeCmd = (str) => {
        const SUBCMDS = [
            'publish',
            'listen',
            'subscribe',
            'unsubscribe',
            'sub',
            'unsub',
            'keys',
            'config',
            'tui',
            'login',
            'logout',
            'whoami',
            'channels',
            'run',
            'help',
        ];

        const parts = str.match(/("[^"]*"|'[^']*'|`[^`]*`|\S+)/g) ?? [];
        let sawBinary = false;
        let sawSub = false;
        return parts.map((p) => {
            if (p === 'emitsignal' || p === 'es') {
                sawBinary = true;
                return { p, type: 'bin' };
            }
            if (/^["'`]/.test(p)) return { p, type: 'str' };
            if (/^-/.test(p)) return { p, type: 'flag' };
            if (['&&', '<', '<=', '>', '>=', '|', '||'].includes(p)) return { p, type: 'op' };
            if (!sawSub && sawBinary && SUBCMDS.includes(p)) {
                sawSub = true;
                return { p, type: 'sub' };
            }
            return { p, type: 'arg' };
        });
    };

    const COLOR_MAP = {
        arg: { color: '#f5f0ff' },
        bin: { color: '#a78bfa', fontWeight: 600 },
        flag: { color: '#fbbf24' },
        op: { color: '#7a6d99' },
        str: { color: '#4ade80' },
        sub: { color: '#67e8f9' },
    };

    const str = deSmarten(extractText(children));
    const toks = tokenizeCmd(str);

    return (
        <div
            style={{
                alignItems: 'flex-start',
                display: 'flex',
                gap: 9,
                padding: '2px 0',
                whiteSpace: wrap ? 'pre-wrap' : 'nowrap',
                wordBreak: wrap ? 'break-word' : 'normal',
            }}
        >
            {prompt && (
                <span style={{ color: '#4ade80', flexShrink: 0, userSelect: 'none' }}>$</span>
            )}
            <span style={{ flex: 1, minWidth: 0 }}>
                {toks.map((t, i) => (
                    <span key={i} style={COLOR_MAP[t.type]}>
                        {i > 0 ? ' ' : ''}
                        {t.p}
                    </span>
                ))}
            </span>
        </div>
    );
};

// ── Output helpers ─────────────────────────────────────────────

export const Cmt = ({ children }) => (
    <div style={{ color: '#7a6d99', padding: '2px 0', whiteSpace: 'pre-wrap' }}>{children}</div>
);

export const Out = ({ children, color = '#b8a9d9' }) => (
    <div style={{ color, padding: '2px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {children}
    </div>
);

export const Ok = ({ children }) => (
    <div style={{ color: '#a78bfa', padding: '2px 0', whiteSpace: 'pre-wrap' }}>✓ {children}</div>
);

export const ErrLine = ({ children }) => (
    <div style={{ color: '#f87171', padding: '2px 0', whiteSpace: 'pre-wrap' }}>✗ {children}</div>
);

export const Arrow = ({ children }) => (
    <div style={{ color: '#7a6d99', padding: '2px 0', whiteSpace: 'pre-wrap' }}>→ {children}</div>
);

export const Sp = () => <div style={{ height: 10 }} />;

export const Caret = () => (
    <span
        style={{
            animation: 'esCaret 1.1s steps(2) infinite',
            background: '#a78bfa',
            display: 'inline-block',
            height: 15,
            marginLeft: 3,
            verticalAlign: 'text-bottom',
            width: 8,
        }}
    />
);

// ── Priority dot ───────────────────────────────────────────────

export const Dot = ({ level = 3, size = 8 }) => {
    const color =
        level === 1
            ? '#818cf8'
            : level === 2
              ? '#a78bfa'
              : level === 3
                ? '#c4b5fd'
                : level === 4
                  ? '#fbbf24'
                  : level === 5
                    ? '#f87171'
                    : '#a78bfa';

    return (
        <span
            style={{
                background: color,
                borderRadius: '50%',
                boxShadow: `0 0 ${size}px ${color}99`,
                display: 'inline-block',
                flexShrink: 0,
                height: size,
                verticalAlign: 'middle',
                width: size,
            }}
        />
    );
};
