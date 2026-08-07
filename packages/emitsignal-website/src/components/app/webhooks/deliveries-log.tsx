import { applyTemplate as applyTemplateExact } from '@emitsignal/shared/webhook-template';
import { useNavigate } from '@tanstack/react-router';
import { Copy, Edit, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import type { WebhookDelivery, WebhookTemplate } from '#/lib/api';

import { useWebhook } from '#/hooks/use-webhook';
import { useWebhookDeliveries } from '#/hooks/use-webhook-deliveries';
import { API_URL } from '#/lib/api';
import { formatExpiry } from '#/lib/format';

import type { WebhookSource } from './source-glyph';

import { JsonView } from './json-view';
import { NotifPreview } from './notif-preview';
import { SourceGlyph } from './source-glyph';
import { applyTemplate } from './template-string';

export function DeliveriesLog({ webhookId }: { webhookId: string }) {
    const [copied, setCopied] = useState(false);
    const [replaying, setReplaying] = useState(false);
    const [replayMsg, setReplayMsg] = useState<null | string>(null);
    const [selectedId, setSelectedId] = useState<null | string>(null);

    const navigate = useNavigate();
    const { webhook } = useWebhook(webhookId);
    const { deliveries, loading, refresh } = useWebhookDeliveries(webhookId, webhook?.topicName);

    const active: undefined | WebhookDelivery =
        (selectedId ? deliveries.find((delivery) => delivery.id === selectedId) : undefined) ??
        deliveries[0];

    async function handleReplay(delivery: WebhookDelivery) {
        if (!webhook) {
            return;
        }

        setReplaying(true);
        setReplayMsg(null);

        try {
            const res = await fetch(`${API_URL}/h/${webhook.slug}`, {
                body: JSON.stringify(delivery.payload),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (res.ok) {
                setReplayMsg('✓ replayed');
                setTimeout(() => setReplayMsg(null), 3000);

                await refresh();
            } else {
                setReplayMsg(`✗ ${res.status}`);
            }
        } catch {
            setReplayMsg('✗ failed');
        } finally {
            setReplaying(false);
        }
    }

    async function handleCopyPayload(delivery: WebhookDelivery) {
        await navigator.clipboard.writeText(JSON.stringify(delivery.payload, null, 2));

        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    async function handleEditTemplate() {
        await navigate({ params: { webhookId }, to: '/app/webhooks/$webhookId/edit' });
    }

    // Render the template against the active delivery's payload for the notification preview
    function getRendered(delivery: WebhookDelivery) {
        if (!delivery.templated || !webhook?.template) {
            return null;
        }

        try {
            const template = JSON.parse(webhook.template) as WebhookTemplate;

            return {
                body: applyTemplate(template.body ?? '', delivery.payload),
                channel: delivery.channel,
                link: applyTemplate(template.link ?? '', delivery.payload).trim(),
                linkLabel: applyTemplateExact(template.linkLabel ?? '', delivery.payload),
                priority: Number(template.priority ?? '3'),
                tags: applyTemplate(template.tags ?? '', delivery.payload),
                title: applyTemplate(template.title ?? '', delivery.payload),
            };
        } catch {
            return null;
        }
    }

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center font-mono text-[12px] text-dim">
                loading…
            </div>
        );
    }

    if (deliveries.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center font-mono text-[12px] text-dim">
                no deliveries yet
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1">
            {/* list pane */}
            <div className="w-[440px] shrink-0 overflow-auto border-r border-line">
                {deliveries.map((delivery) => {
                    const isActive = active?.id === delivery.id;
                    const summary = getSummary(delivery);

                    return (
                        <button
                            className="flex w-full cursor-pointer items-center gap-3 border-b border-line px-4.5 py-3 text-left"
                            key={delivery.id}
                            onClick={() => setSelectedId(delivery.id)}
                            style={{
                                background: isActive ? 'var(--color-elev)' : 'transparent',
                                borderLeft: `3px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
                            }}
                        >
                            <SourceGlyph size={32} source={delivery.source as WebhookSource} />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-mono text-[10.5px] text-dim">
                                        {delivery.channel}
                                    </span>
                                    <span className="ml-auto font-mono text-[10px] text-dim">
                                        {delivery.time}
                                    </span>
                                </div>
                                <div className="mt-0.5 truncate text-[13px] font-semibold">
                                    {summary}
                                </div>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <span className="font-mono text-[10px] text-success">
                                        {delivery.status}
                                    </span>
                                    <span className="font-mono text-[10px] text-faint">
                                        {delivery.durationMs}ms
                                    </span>
                                    <ExpiryLabel expiresAt={delivery.expiresAt} />
                                    {delivery.templated ? (
                                        <span
                                            className="rounded px-1.5 py-0.5 font-mono text-[9.5px] text-accent"
                                            style={{
                                                background:
                                                    'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                                            }}
                                        >
                                            templated
                                        </span>
                                    ) : (
                                        <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[9.5px] text-dim">
                                            raw
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* detail pane */}
            {active && (
                <div className="min-w-0 flex-1 overflow-auto p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <SourceGlyph size={30} source={active.source as WebhookSource} />
                        <div>
                            <div className="text-[14.5px] font-semibold">{active.channel}</div>
                            <div className="mt-0.5 font-mono text-[10.5px] text-dim">
                                delivery {active.id.slice(0, 8)} · {active.time}
                            </div>
                        </div>
                        <div className="ml-auto flex items-center gap-3.5 font-mono text-[11px]">
                            <span className="text-success">● {active.status} OK</span>
                            <span className="text-dim">{active.durationMs}ms</span>
                            <ExpiryLabel expiresAt={active.expiresAt} />
                        </div>
                    </div>

                    <SectionLabel
                        right={
                            active.templated ? (
                                <span className="flex items-center gap-1 font-mono text-[10px] text-accent">
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
                                    {active.source} template
                                </span>
                            ) : null
                        }
                    >
                        Output · Published Notification
                    </SectionLabel>

                    {active.templated ? (
                        (() => {
                            const r = getRendered(active);
                            return r ? (
                                <NotifPreview {...r} />
                            ) : (
                                <NotifPreview
                                    body={getSummary(active)}
                                    channel={active.channel}
                                    priority={3}
                                    tags={[active.source]}
                                    title={getSummary(active)}
                                />
                            );
                        })()
                    ) : (
                        <div className="rounded-xl border border-line bg-deep p-3.5">
                            <div className="mb-2 font-mono text-[10.5px] text-dim">
                                {active.channel} ·{' '}
                                <span className="text-faint">raw passthrough</span>
                            </div>
                            <JsonView data={active.payload} size={11.5} />
                        </div>
                    )}

                    <div className="flex justify-center py-3.5">
                        <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-faint">
                            <svg
                                fill="none"
                                height={13}
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                                width={13}
                            >
                                <line x1="12" x2="12" y1="5" y2="19" />
                                <polyline points="19 12 12 19 5 12" />
                            </svg>
                            rendered from the request payload below
                        </span>
                    </div>

                    <SectionLabel
                        right={
                            <span className="font-mono text-[10px] text-faint">
                                POST · application/json
                            </span>
                        }
                    >
                        Request Payload
                    </SectionLabel>
                    <div className="rounded-xl border border-line bg-deep p-3.5">
                        <JsonView data={active.payload} size={11.5} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted hover:bg-elev hover:text-fg disabled:opacity-50"
                            disabled={replaying || !webhook}
                            onClick={() => void handleReplay(active)}
                        >
                            <RefreshCw className={replaying ? 'animate-spin' : ''} size={12} />
                            {replaying ? 'Replaying…' : 'Replay'}
                        </button>
                        <button
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted hover:bg-elev hover:text-fg"
                            onClick={() => void handleEditTemplate()}
                        >
                            <Edit size={12} /> Edit template
                        </button>
                        <button
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-mono text-[11.5px] text-muted hover:bg-elev hover:text-fg"
                            onClick={() => void handleCopyPayload(active)}
                        >
                            <Copy size={12} /> {copied ? 'Copied!' : 'Copy payload'}
                        </button>
                        {replayMsg && (
                            <span
                                className={`ml-1 font-mono text-[11px] ${replayMsg.startsWith('✓') ? 'text-success' : 'text-danger'}`}
                            >
                                {replayMsg}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// How long this delivery record survives before the retention sweep removes it.
// The API sends unix seconds.
function ExpiryLabel({ expiresAt }: { expiresAt: null | number }) {
    if (!expiresAt) {
        return null;
    }

    const expiry = formatExpiry(expiresAt * 1000);

    return (
        <span
            className="font-mono text-[10px]"
            style={{ color: expiry.expired ? 'var(--color-danger)' : 'var(--color-faint)' }}
            title={`Delivery record removed on ${new Date(expiresAt * 1000).toLocaleString()}`}
        >
            {expiry.expired ? 'expired' : `expires ${expiry.text.toLowerCase()}`}
        </span>
    );
}

function getSummary(delivery: WebhookDelivery): string {
    if (typeof delivery.payload === 'object' && delivery.payload !== null) {
        const payload = delivery.payload as Record<string, unknown>;
        if (typeof payload['type'] === 'string') return payload['type'];
        if (typeof payload['event'] === 'string') return payload['event'];
        if (typeof payload['action'] === 'string')
            return `${delivery.source} · ${payload['action']}`;
    }
    return `${delivery.source} delivery`;
}

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
    return (
        <div className="mb-2.5 flex items-center">
            <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-dim">
                {children}
            </span>
            {right && <span className="ml-auto">{right}</span>}
        </div>
    );
}
