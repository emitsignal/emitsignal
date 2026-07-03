import { AlertTriangle, Copy, GitBranch, MoreHorizontal, X } from 'lucide-react';
import { useState } from 'react';

import type { ApiKey } from '#/hooks/use-api-keys';

import { Dot } from '#/components/ui/dot';
import { Pill } from '#/components/ui/pill';
import { Sparkline } from '#/components/ui/sparkline';

function formatExpiry(date: Date | null): { expired: boolean; text: string } {
    if (!date) {
        return { expired: false, text: 'Never' };
    }

    const diff = new Date(date).getTime() - Date.now();

    if (diff <= 0) {
        return { expired: true, text: 'Expired' };
    }
    const days = Math.ceil(diff / 86_400_000);

    if (days <= 1) {
        return { expired: false, text: 'Today' };
    }

    if (days < 7) {
        return { expired: false, text: `${days}d` };
    }

    if (days < 30) {
        return { expired: false, text: `${Math.round(days / 7)}w` };
    }

    if (days < 365) {
        return { expired: false, text: `${Math.round(days / 30)}mo` };
    }

    return { expired: false, text: `${Math.round(days / 365)}y` };
}

function timeAgo(date: Date | null): string {
    if (!date) {
        return 'Never';
    }

    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60_000);

    if (minutes < 1) {
        return 'Just now';
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    return `${Math.floor(hours / 24)}d ago`;
}

const SPARK = [2, 4, 3, 8, 5, 12, 9, 14, 11, 18, 15, 22];

const COL_TEMPLATE = '1.4fr 1.85fr 0.75fr 0.75fr 0.95fr 50px';

interface KeysTableProps {
    apiKeys: ApiKey[];
    loading: boolean;
    onCreate: () => void;
    onDelete: (id: string) => void;
    onFlash: (msg: string, kind?: 'danger' | 'ok' | 'warn') => void;
    onRevoke: (key: ApiKey) => void;
    onRoll: (key: ApiKey) => void;
}

export function KeysTable({
    apiKeys,
    loading,
    onCreate,
    onDelete,
    onFlash,
    onRevoke,
    onRoll,
}: KeysTableProps) {
    const [menuFor, setMenuFor] = useState<null | string>(null);

    const copyPrefix = async (key: ApiKey) => {
        const prefix = key.start ?? '';
        await navigator.clipboard.writeText(prefix);

        onFlash('Key prefix copied');
        setMenuFor(null);
    };

    if (loading) {
        return (
            <div className="mb-7 overflow-hidden rounded-[10px] border border-line bg-elev">
                <div className="py-10 text-center font-mono text-[12px] text-dim">Loading...</div>
            </div>
        );
    }

    if (apiKeys.length === 0) {
        return (
            <div className="mb-7 overflow-hidden rounded-[10px] border border-line bg-elev">
                <div className="py-9 text-center text-[13px] text-dim">
                    No keys yet.{' '}
                    <button
                        className="cursor-pointer text-accent hover:underline"
                        onClick={onCreate}
                    >
                        Create your first key →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-7 overflow-visible rounded-[10px] border border-line bg-elev">
            <div
                className="border-b border-line px-[18px] py-[11px] font-mono text-[10px] uppercase tracking-[1.2px] text-dim"
                style={{ display: 'grid', gap: 12, gridTemplateColumns: COL_TEMPLATE }}
            >
                <span>NAME</span>
                <span>KEY</span>
                <span>EXPIRES</span>
                <span>LAST USED</span>
                <span>REQUESTS · 7D</span>
                <span />
            </div>

            {apiKeys.map((apiKey, index) => {
                const isLast = index === apiKeys.length - 1;
                const isRevoked = !apiKey.enabled;
                const maskedDisplay = `${(apiKey.start ?? '').slice(0, 11)}••••`;
                const isMenuOpen = menuFor === apiKey.id;
                const expiry = formatExpiry(apiKey.expiresAt);

                return (
                    <div
                        className={`items-center px-[18px] py-[13px] ${isLast ? '' : 'border-b border-line'}`}
                        key={apiKey.id}
                        style={{
                            display: 'grid',
                            gap: 12,
                            gridTemplateColumns: COL_TEMPLATE,
                            opacity: isRevoked ? 0.5 : 1,
                            position: 'relative',
                        }}
                    >
                        {/* NAME */}
                        <div className="flex min-w-0 items-center gap-[9px]">
                            <Dot level={3} size={5} />
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium">
                                {apiKey.name ?? 'Unnamed'}
                            </span>
                            {!apiKey.enabled && <Pill tone="danger">revoked</Pill>}
                        </div>

                        {/* KEY */}
                        <div className="flex min-w-0 items-center gap-[7px]">
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[12px] text-muted">
                                {maskedDisplay}
                            </span>
                            <button
                                className="flex flex-shrink-0"
                                onClick={(event) => {
                                    event.stopPropagation();

                                    void copyPrefix(apiKey);
                                }}
                                title="Copy prefix"
                            >
                                <Copy className="text-dim hover:text-fg" size={12} />
                            </button>
                        </div>

                        {/* EXPIRES */}
                        <span
                            className="font-mono text-[11.5px]"
                            style={{
                                color: expiry.expired ? 'var(--color-danger)' : 'var(--color-dim)',
                            }}
                        >
                            {expiry.text}
                        </span>

                        {/* LAST USED */}
                        <span className="font-mono text-[11.5px] text-dim">
                            {timeAgo(apiKey.lastRequest)}
                        </span>

                        {/* REQUESTS */}
                        <div className="flex items-center gap-2.5">
                            <span className="font-mono text-[12px] text-fg">
                                {apiKey.requestCount.toLocaleString()}
                            </span>

                            {apiKey.requestCount > 0 && (
                                <Sparkline
                                    color="var(--color-accent)"
                                    data={SPARK}
                                    height={18}
                                    width={52}
                                />
                            )}
                        </div>

                        {/* ACTIONS */}
                        <div className="relative flex justify-end">
                            {isRevoked ? (
                                <button
                                    className="flex p-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(apiKey.id);
                                    }}
                                    title="Delete permanently"
                                >
                                    <X className="text-dim hover:text-danger" size={15} />
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="flex rounded-[5px] p-1 transition-colors"
                                        onClick={(event) => {
                                            event.stopPropagation();

                                            setMenuFor(isMenuOpen ? null : apiKey.id);
                                        }}
                                        style={{
                                            background: isMenuOpen
                                                ? 'var(--color-elev-2)'
                                                : 'transparent',
                                        }}
                                    >
                                        <MoreHorizontal className="text-dim" size={15} />
                                    </button>

                                    {isMenuOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-[25]"
                                                onClick={(event) => {
                                                    event.stopPropagation();

                                                    setMenuFor(null);
                                                }}
                                            />

                                            <div
                                                className="absolute right-0 top-7 z-30 w-[180px] overflow-hidden rounded-[9px] border border-line p-1 shadow-2xl"
                                                onClick={(event) => event.stopPropagation()}
                                                style={{ background: 'var(--color-elev-2)' }}
                                            >
                                                <MenuItem
                                                    icon={<Copy size={13} />}
                                                    onClick={() => void copyPrefix(apiKey)}
                                                >
                                                    Copy prefix
                                                </MenuItem>
                                                <MenuItem
                                                    icon={<GitBranch size={13} />}
                                                    onClick={() => {
                                                        setMenuFor(null);
                                                        onRoll(apiKey);
                                                    }}
                                                >
                                                    Roll &amp; re-issue
                                                </MenuItem>

                                                <div className="my-1 h-px bg-line" />

                                                <MenuItem
                                                    danger
                                                    icon={<AlertTriangle size={13} />}
                                                    onClick={() => {
                                                        setMenuFor(null);
                                                        onRevoke(apiKey);
                                                    }}
                                                >
                                                    Revoke key
                                                </MenuItem>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function MenuItem({
    children,
    danger,
    icon,
    onClick,
}: {
    children: React.ReactNode;
    danger?: boolean;
    icon: React.ReactNode;
    onClick: () => void;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            className="flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-[12.5px] font-medium transition-colors"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered
                    ? danger
                        ? 'rgba(248,113,113,0.10)'
                        : 'var(--color-elev)'
                    : 'transparent',
                color: danger ? 'var(--color-danger)' : 'var(--color-muted)',
            }}
        >
            {icon}

            {children}
        </button>
    );
}
