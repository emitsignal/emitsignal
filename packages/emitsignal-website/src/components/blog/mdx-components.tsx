import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { withAlpha } from '#/lib/color';

import { BlogCode } from './blog-code';

type CalloutTone = 'amber' | 'green' | 'red' | 'violet';

const CALLOUT_COLORS: Record<CalloutTone, string> = {
    amber: 'var(--color-warn)',
    green: 'var(--color-success)',
    red: 'var(--color-danger)',
    violet: 'var(--color-accent)',
};

export function Callout({
    children,
    tone = 'violet',
}: {
    children: ReactNode;
    tone?: CalloutTone;
}) {
    const color = CALLOUT_COLORS[tone];
    return (
        <div
            className="my-5 flex gap-3.5 rounded-xl border p-4"
            style={{ background: withAlpha(color, 6), borderColor: withAlpha(color, 27) }}
        >
            <span className="mt-0.5 shrink-0 text-base" style={{ color }}>
                ⚡
            </span>
            <div className="text-[15px] leading-[1.6] text-fg">{children}</div>
        </div>
    );
}

export function Quote({ children, cite }: { children: ReactNode; cite?: string }) {
    return (
        <blockquote className="my-6 border-l-[3px] border-accent py-1 pl-5">
            <div className="text-lg font-medium leading-[1.5] tracking-tight text-fg">
                "{children}"
            </div>
            {cite && <div className="mt-2.5 font-mono text-[12px] text-dim">— {cite}</div>}
        </blockquote>
    );
}

function Blockquote({ children, ...props }: ComponentPropsWithoutRef<'blockquote'>) {
    return (
        <blockquote
            className="my-6 border-l-[3px] border-accent py-1 pl-5 text-lg font-medium leading-[1.5] tracking-tight text-fg"
            {...props}
        >
            {children}
        </blockquote>
    );
}

function Code({ children, ...props }: ComponentPropsWithoutRef<'code'>) {
    return (
        <code
            className="rounded border border-line bg-deep px-1.5 py-0.5 font-mono text-[0.88em] text-accent"
            {...props}
        >
            {children}
        </code>
    );
}

function H2({ children, id, ...props }: ComponentPropsWithoutRef<'h2'>) {
    return (
        <h2
            className="mb-3 mt-10 scroll-mt-20 text-2xl font-semibold leading-[1.2] tracking-tight text-fg"
            id={id}
            {...props}
        >
            <span className="mr-2.5 font-mono text-base text-accent/70">#</span>
            {children}
        </h2>
    );
}

function Li({ children, ...props }: ComponentPropsWithoutRef<'li'>) {
    return (
        <li className="flex items-baseline gap-3 text-base leading-[1.65] text-muted" {...props}>
            <span className="shrink-0 font-mono text-[13px] text-accent">→</span>
            <span>{children}</span>
        </li>
    );
}

function Ol({ children, ...props }: ComponentPropsWithoutRef<'ol'>) {
    return (
        <ol className="mb-5 mt-1 list-none space-y-2.5 p-0" {...props}>
            {children}
        </ol>
    );
}

function P({ children, ...props }: ComponentPropsWithoutRef<'p'>) {
    return (
        <p className="mb-4 text-[16.5px] leading-[1.72] text-muted" {...props}>
            {children}
        </p>
    );
}

function Pre({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
    const child = children as React.ReactElement<{ children?: string; className?: string }>;
    const src = typeof child?.props?.children === 'string' ? child.props.children : '';
    const className = child?.props?.className ?? '';
    return <BlogCode className={className} src={src.replace(/\n$/, '')} {...props} />;
}

function Ul({ children, ...props }: ComponentPropsWithoutRef<'ul'>) {
    return (
        <ul className="mb-5 mt-1 list-none space-y-2.5 p-0" {...props}>
            {children}
        </ul>
    );
}

export const mdxComponents = {
    blockquote: Blockquote,
    Callout,
    code: Code,
    h2: H2,
    li: Li,
    ol: Ol,
    p: P,
    pre: Pre,
    Quote,
    ul: Ul,
};
