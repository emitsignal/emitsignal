import { useState } from 'react';

import { cn } from '#/lib/cn';

const C = {
    com: '#7a6d99',
    def: '#f5f0ff',
    flag: '#a78bfa',
    fn: '#67e8f9',
    kw: '#c4b5fd',
    num: '#f0abfc',
    op: '#b8a9d9',
    prompt: '#4ade80',
    str: '#fbbf24',
};

interface BlogCodeProps {
    className?: string;
    src: string;
}

export function BlogCode({ className, src }: BlogCodeProps) {
    const [copied, setCopied] = useState(false);

    const lang = className?.replace('language-', '') ?? 'text';
    const html = highlightCode(src, lang);

    function handleCopy() {
        navigator.clipboard?.writeText(src);

        setCopied(true);

        setTimeout(() => setCopied(false), 1400);
    }

    return (
        <div className="relative my-4 overflow-hidden rounded-[10px] border border-line bg-deep">
            <div className="flex items-center gap-2 border-b border-line px-3.5 py-2">
                <span className="flex gap-1.5">
                    {['#ff5f56', '#ffbd2e', '#27c93f'].map((background) => (
                        <span
                            className="h-2 w-2 rounded-full opacity-85"
                            key={background}
                            style={{ background }}
                        />
                    ))}
                </span>

                <span className="ml-1.5 font-mono text-[10px] uppercase tracking-[1px] text-dim">
                    {lang}
                </span>

                <button
                    className={cn(
                        'ml-auto inline-flex items-center gap-1.5 rounded border border-line px-2 py-0.5 font-mono text-[10px] transition-colors',
                        copied ? 'text-success' : 'text-dim hover:text-muted',
                    )}
                    onClick={handleCopy}
                    type="button"
                >
                    {copied ? '✓ copied' : 'copy'}
                </button>
            </div>

            <pre className="overflow-x-auto p-4 text-[13px] leading-[1.7]">
                <code dangerouslySetInnerHTML={{ __html: html }} />
            </pre>
        </div>
    );
}

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightCode(src: string, lang: string): string {
    return src
        .split('\n')
        .map((line) => {
            if (/^\s*#/.test(line) && (lang === 'bash' || lang === 'text' || lang === 'yaml')) {
                return span(line, C.com);
            }

            let out = '';
            let rest = line;
            const pm = rest.match(/^(\s*\$ )/);
            if (pm) {
                out += span(pm[1], C.prompt);
                rest = rest.slice(pm[1].length);
            }
            const re =
                /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d[\d.,]*\b)|(--?[a-zA-Z][\w-]*)|(\b(?:curl|echo|let|fn|await|return|map|collect|async|use|pub|priority|tag|hour|between|AND|OR|NOT|within|event|status|label|reviewer|message|emitsignal|brew|pg_dump|gzip|date|cron|run|if|always|export|const|type)\b)|([A-Za-z_][\w]*\s*(?=\())|([\S\s])/g;

            let m;

            while ((m = re.exec(rest)) !== null) {
                if (m[1]) {
                    out += span(m[1], C.str);
                } else if (m[2]) {
                    out += span(m[2], C.num);
                } else if (m[3]) {
                    out += span(m[3], C.flag);
                } else if (m[4]) {
                    out += span(m[4], C.kw);
                } else if (m[5]) {
                    out += span(m[5], C.fn);
                } else {
                    out += esc(m[0]);
                }
            }

            return out;
        })
        .join('\n');
}

function span(text: string, color: string): string {
    return `<span style="color:${color}">${esc(text)}</span>`;
}
