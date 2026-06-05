import { useNavigate } from '@tanstack/react-router';
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { Webhook } from '#/lib/api';

import { API_URL } from '#/lib/api';

import type { WebhookSource } from './source-glyph';

import { SourceGlyph } from './source-glyph';

interface TableProps {
    loading: boolean;
    remove: (id: string) => Promise<void>;
    update: (id: string, input: { status?: string }) => Promise<unknown>;
    webhooks: Webhook[];
}

const COL = 'grid-cols-[2.2fr_1.4fr_1fr_0.8fr_0.7fr_100px]';

export function WebhooksTable({ loading, remove, update, webhooks }: TableProps) {
    if (loading) {
        return <div className="py-8 text-center font-mono text-[12px] text-dim">loading…</div>;
    }

    if (webhooks.length === 0) {
        return (
            <div className="py-8 text-center font-mono text-[12px] text-dim">no webhooks yet</div>
        );
    }

    return (
        <div className="rounded-xl border border-line bg-elev">
            <div
                className={`grid ${COL} gap-3.5 rounded-t-xl border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[1.3px] text-dim`}
            >
                <span>Webhook</span>
                <span>Endpoint</span>
                <span>Output</span>
                <span>24h</span>
                <span>Last</span>
                <span>Status</span>
            </div>

            {webhooks.map((webhook, index) => (
                <WebhookRow
                    key={webhook.id}
                    last={index === webhooks.length - 1}
                    remove={remove}
                    update={update}
                    webhook={webhook}
                />
            ))}
        </div>
    );
}

function formatRelativeTime(unix: number): string {
    const secondsDiff = Math.floor(Date.now() / 1000) - unix;
    if (secondsDiff < 60) return `${secondsDiff}s ago`;
    if (secondsDiff < 3600) return `${Math.floor(secondsDiff / 60)}m ago`;
    if (secondsDiff < 86400) return `${Math.floor(secondsDiff / 3600)}h ago`;
    return `${Math.floor(secondsDiff / 86400)}d ago`;
}

function KebabItem({
    danger,
    label,
    onClick,
}: {
    danger?: boolean;
    label: string;
    onClick: (e: React.MouseEvent) => void;
}) {
    return (
        <button
            className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-[12.5px] hover:bg-elev-2"
            onClick={onClick}
            style={{ color: danger ? 'var(--color-danger)' : 'var(--color-muted)' }}
        >
            {label}
        </button>
    );
}

function StatusDot({ status }: { status: Webhook['status'] }) {
    const map: Record<Webhook['status'], [string, string]> = {
        active: ['#4ade80', 'active'],
        error: ['#f87171', 'error'],
        paused: ['#fbbf24', 'paused'],
    };
    const [color, label] = map[status];
    return (
        <div className="flex items-center gap-1.5 font-mono text-[10.5px]" style={{ color }}>
            <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: color, boxShadow: `0 0 6px ${color}99` }}
            />
            {label}
        </div>
    );
}

function TemplatedIcon() {
    return (
        <svg
            fill="none"
            height={11}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox="0 0 24 24"
            width={11}
        >
            <path d="M7 4a2 2 0 00-2 2v3a2 2 0 01-2 2 2 2 0 012 2v3a2 2 0 002 2" />
            <path d="M17 4a2 2 0 012 2v3a2 2 0 002 2 2 2 0 00-2 2v3a2 2 0 01-2 2" />
        </svg>
    );
}

function WebhookRow({
    last,
    remove,
    update,
    webhook,
}: {
    last: boolean;
    remove: (id: string) => Promise<void>;
    update: (id: string, input: { status?: string }) => Promise<unknown>;
    webhook: Webhook;
}) {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const lastLabel = webhook.lastDeliveryAt ? formatRelativeTime(webhook.lastDeliveryAt) : '—';

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        function onDoc(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        }
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [menuOpen]);

    function handleRowClick() {
        void navigate({ params: { webhookId: webhook.id }, to: '/app/webhooks/$webhookId' });
    }

    function handleCopy(e: React.MouseEvent) {
        e.stopPropagation();
        void navigator.clipboard.writeText(`${API_URL}/h/${webhook.slug}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    function handleEdit(e: React.MouseEvent) {
        e.stopPropagation();
        setMenuOpen(false);
        void navigate({ params: { webhookId: webhook.id }, to: '/app/webhooks/$webhookId/edit' });
    }

    async function handleToggleStatus(e: React.MouseEvent) {
        e.stopPropagation();
        setMenuOpen(false);
        await update(webhook.id, { status: webhook.status === 'active' ? 'paused' : 'active' });
    }

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        setMenuOpen(false);
        if (!window.confirm(`Delete "${webhook.name}"? This cannot be undone.`)) return;
        await remove(webhook.id);
    }

    return (
        <div
            className={`grid ${COL} cursor-pointer items-center gap-3.5 px-4 py-3 transition-colors hover:bg-elev-2 ${last ? 'rounded-b-xl' : 'border-b border-line'}`}
            onClick={handleRowClick}
        >
            {/* Name + source */}
            <div className="flex min-w-0 items-center gap-3">
                <SourceGlyph size={34} source={webhook.source as WebhookSource} />
                <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold">{webhook.name}</div>
                    <div className="mt-0.5 font-mono text-[10.5px] text-dim">
                        → {webhook.topicName}
                    </div>
                </div>
            </div>

            {/* Endpoint + copy */}
            <div
                className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-muted"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="truncate">/h/{webhook.slug}</span>
                <button
                    className="shrink-0 cursor-pointer text-faint hover:text-fg"
                    onClick={handleCopy}
                    title={copied ? 'Copied!' : 'Copy endpoint URL'}
                >
                    {copied ? (
                        <span className="text-[9px] text-success">✓</span>
                    ) : (
                        <svg
                            fill="none"
                            height={11}
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            width={11}
                        >
                            <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Output badge */}
            <div>
                {webhook.templated ? (
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-medium text-accent"
                        style={{
                            background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
                            borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                        }}
                    >
                        <TemplatedIcon /> templated
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-full border border-line px-2.5 py-0.5 font-mono text-[10.5px] text-dim">
                        raw
                    </span>
                )}
            </div>

            {/* 24h / last */}
            <div className="font-mono text-[12px]">{webhook.count24h.toLocaleString()}</div>
            <div className="font-mono text-[11.5px] text-dim">{lastLabel}</div>

            {/* Status + kebab */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <StatusDot status={webhook.status} />
                <div className="relative ml-auto" ref={menuRef}>
                    <button
                        className="flex cursor-pointer items-center rounded p-0.5 text-faint hover:bg-elev-2 hover:text-fg"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((v) => !v);
                        }}
                    >
                        <MoreHorizontal size={14} />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-6 z-20 min-w-[140px] overflow-hidden rounded-lg border border-line bg-elev shadow-lg">
                            <KebabItem label="Edit" onClick={handleEdit} />
                            <KebabItem
                                label={webhook.status === 'active' ? 'Disable' : 'Enable'}
                                onClick={(e) => void handleToggleStatus(e)}
                            />
                            <KebabItem
                                danger
                                label="Delete"
                                onClick={(e) => void handleDelete(e)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
