import type { ReactNode } from 'react';

import { Link } from '@tanstack/react-router';

import { cn } from '#/lib/cn';

interface BaseProps {
    children: ReactNode;
    className?: string;
    icon?: ReactNode;
    monospace?: boolean;
    variant?: Variant;
}

type ButtonProps = ExternalLink | InternalLink;

interface ExternalLink extends BaseProps {
    href: string;
    to?: never;
}
interface InternalLink extends BaseProps {
    href?: never;
    to: string;
}

type Variant = 'primary' | 'secondary';

const BASE_CLASS =
    'inline-flex cursor-pointer items-center gap-2 rounded-lg px-[18px] py-[11px] text-[13.5px] font-semibold no-underline transition-colors active:translate-y-px';

function isExternal(href: string): boolean {
    return /^(https?:|mailto:)/.test(href);
}

const VARIANT_CLASS: Record<Variant, string> = {
    primary: 'bg-accent text-bg hover:bg-accent-hover',
    secondary: 'border border-line text-fg hover:bg-elev',
};

export function Button({
    children,
    icon,
    monospace = true,
    variant = 'secondary',
    ...props
}: ButtonProps) {
    const className = cn(
        BASE_CLASS,
        VARIANT_CLASS[variant],
        monospace ? 'font-mono' : 'font-sans',
        props.className,
    );

    const inner = (
        <>
            {children}
            {icon}
        </>
    );

    if ('to' in props && props.to) {
        return (
            <Link className={className} to={props.to as never}>
                {inner}
            </Link>
        );
    }
    const href = props.href ?? '#';
    const external = isExternal(href);

    return (
        <a
            className={className}
            href={href}
            rel={external ? 'noopener noreferrer' : undefined}
            target={external ? '_blank' : undefined}
        >
            {inner}
        </a>
    );
}
