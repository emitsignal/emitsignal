import type { VerificationConfig, VerificationScheme } from '@emitsignal/shared';

import {
    DEFAULT_CONFIG_BY_SOURCE,
    defaultVerificationForSource,
    schemeNeedsConfig,
    VERIFICATION_LABELS,
} from '@emitsignal/shared';
import { isValidTopicName } from '@emitsignal/shared/topic';
import { applyTemplate as applyTemplateExact } from '@emitsignal/shared/webhook-template';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { Webhook, WebhookTemplate } from '#/lib/api';

import { useSubscriptions } from '#/ctx/subscriptions';
import { api, API_URL } from '#/lib/api';
import { queryKeys } from '#/lib/query-client';

import type { TemplateTextField } from './template-fields';
import type { WebhookTab } from './webhook-tab-bar';

import { JsonView } from './json-view';
import { NotifPreview } from './notif-preview';
import { EMPTY_TEMPLATE } from './template-fields';
import { applyTemplate } from './template-string';
import { VerificationFields } from './verification-fields';
import { WebhookChannelField } from './webhook-channel-field';
import { WebhookSettingsTab } from './webhook-settings-tab';
import { WebhookTabBar } from './webhook-tab-bar';
import { WebhookTemplateTab } from './webhook-template-tab';

const SOURCE_DATA: Record<
    string,
    { payload: Record<string, unknown>; template: null | WebhookTemplate }
> = {
    custom: {
        payload: {},
        template: null,
    },
    github: {
        payload: {
            head_commit: {
                id: 'a3f2b1c',
                message: 'fix: tighten retry budget',
                url: 'https://github.com/acme/api-gateway/commit/a3f2b1c',
            },
            pusher: { email: 'maya@acme.io', name: 'maya' },
            ref: 'refs/heads/main',
            repository: { full_name: 'acme/api-gateway', name: 'api-gateway' },
        },
        template: {
            body: '{{pusher.name}} · {{head_commit.message}}',
            link: '{{head_commit.url}}',
            linkLabel: 'View commit',
            priority: '3',
            tags: 'git, push, {{repository.name}}',
            title: 'Push to {{repository.full_name}}',
        },
    },
    grafana: {
        payload: {
            annotations: { summary: 'Memory above 92% for 5m' },
            labels: { alertname: 'HighMemory', instance: 'api-02', severity: 'critical' },
            status: 'firing',
            value: '0.924',
        },
        template: {
            body: '{{annotations.summary}}',
            priority: '5',
            tags: 'grafana, {{labels.severity}}',
            title: '{{labels.alertname}} · {{labels.instance}}',
        },
    },
    stripe: {
        payload: {
            created: 1717430000,
            data: {
                object: {
                    amount: 4182,
                    currency: 'usd',
                    customer: 'cus_19xQa',
                    status: 'succeeded',
                },
            },
            id: 'evt_1Qk2Lr7vN3',
            type: 'payment_intent.succeeded',
        },
        template: {
            body: '{{data.object.amount}} {{data.object.currency}}',
            priority: '3',
            tags: 'stripe, {{data.object.status}}',
            title: '{{type}}',
        },
    },
    vercel: {
        payload: {
            name: 'my-app',
            target: 'production',
            type: 'deployment.succeeded',
            url: 'https://my-app-abc123.vercel.app',
        },
        template: {
            body: '{{url}} → {{target}}',
            priority: '3',
            tags: 'vercel, {{type}}',
            title: 'Deploy {{name}}',
        },
    },
};

type Source = keyof typeof SOURCE_DATA;
const SOURCES: Source[] = ['github', 'grafana', 'stripe', 'vercel', 'custom'];
const GLYPH: Record<Source, string> = {
    custom: '{}',
    github: 'GH',
    grafana: 'GF',
    stripe: 'ST',
    vercel: 'VC',
};

interface WebhookCreateProps {
    initialData?: {
        samplePayload?: null | string;
        template: null | string;
    } & Pick<
        Webhook,
        | 'hasSecret'
        | 'id'
        | 'name'
        | 'slug'
        | 'source'
        | 'topicName'
        | 'verification'
        | 'verificationConfig'
    >;
}

function defaultWebhookName(source: string): string {
    return `${source} webhook`;
}

const EMPTY_CONFIG: VerificationConfig = {
    algorithm: 'sha256',
    encoding: 'hex',
    header: '',
    prefix: '',
};

export function WebhookCreate({ initialData }: WebhookCreateProps = {}) {
    const isEdit = !!initialData;
    const { subscribe, subscriptions } = useSubscriptions();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const initialSource = (initialData?.source ?? 'github') as Source;
    const initialTemplate: null | WebhookTemplate = (() => {
        if (!initialData) return SOURCE_DATA['github']!.template;
        try {
            return initialData.template
                ? (JSON.parse(initialData.template) as WebhookTemplate)
                : null;
        } catch {
            return null;
        }
    })();

    const [activeTab, setActiveTab] = useState<WebhookTab>('template');
    const [copied, setCopied] = useState(false);
    const [payloadText, setPayloadText] = useState(
        initialData?.samplePayload ?? samplePayloadFor(initialSource),
    );
    const [payloadValid, setPayloadValid] = useState(true);
    const [editingPayload, setEditingPayload] = useState(false);
    const [previewMode, setPreviewMode] = useState<'pretty' | 'raw'>('pretty');
    const [saveError, setSaveError] = useState<null | string>(null);
    const [saving, setSaving] = useState(false);
    const [secret, setSecret] = useState('');
    const [scheme, setScheme] = useState<VerificationScheme>(
        initialData?.verification ?? defaultVerificationForSource(initialSource),
    );
    const [reservedSlug, setReservedSlug] = useState('');
    const [slugReservation, setSlugReservation] = useState('');
    const [reserving, setReserving] = useState(false);
    const [invalidField, setInvalidField] = useState<'header' | 'secret' | null>(null);
    const [name, setName] = useState(
        initialData?.name && initialData.name !== defaultWebhookName(initialSource)
            ? initialData.name
            : '',
    );
    const [source, setSource] = useState<Source>(initialSource);
    const [templateFields, setTemplateFields] = useState<WebhookTemplate>(
        initialTemplate ?? EMPTY_TEMPLATE,
    );
    const [topicName, setTopicName] = useState(initialData?.topicName ?? '');
    const [useTemplate, setUseTemplate] = useState(initialTemplate !== null);
    const templateDirtyRef = useRef(false);

    const [verificationConfig, setVerificationConfig] = useState<VerificationConfig>(
        parseConfig(initialData?.verificationConfig) ??
            DEFAULT_CONFIG_BY_SOURCE[initialSource] ??
            EMPTY_CONFIG,
    );
    const verificationDirtyRef = useRef(false);

    // Active payload for preview
    const activePayload: Record<string, unknown> = (() => {
        try {
            return JSON.parse(payloadText) as Record<string, unknown>;
        } catch {
            return {};
        }
    })();

    const showRaw = !useTemplate || previewMode === 'raw';
    const slug = isEdit ? initialData?.slug : reservedSlug;
    const channelInvalid = !!saveError && !topicName.trim();

    const rendered = {
        body: applyTemplate(templateFields.body ?? '', activePayload),
        channel: topicName || `${source}/channel`,
        link: applyTemplate(templateFields.link ?? '', activePayload).trim(),
        linkLabel: applyTemplateExact(templateFields.linkLabel ?? '', activePayload),
        priority: Number(templateFields.priority ?? '3'),
        tags: applyTemplate(templateFields.tags ?? '', activePayload),
        title: applyTemplate(templateFields.title ?? '', activePayload),
    };

    function handleSourceChange(source: Source) {
        if (
            templateDirtyRef.current &&
            !window.confirm('Switch source? Your template edits will be reset.')
        ) {
            return;
        }

        setSource(source);

        const data = SOURCE_DATA[source]!;
        const template = data.template;

        setTemplateFields(template ?? EMPTY_TEMPLATE);
        setUseTemplate(template !== null);
        setPayloadText(samplePayloadFor(source));
        setPayloadValid(true);
        setEditingPayload(false);

        templateDirtyRef.current = false;

        if (!verificationDirtyRef.current) {
            setScheme(defaultVerificationForSource(source));
            setVerificationConfig(DEFAULT_CONFIG_BY_SOURCE[source] ?? EMPTY_CONFIG);
        }
    }

    function handleSchemeChange(next: VerificationScheme) {
        setInvalidField(null);

        verificationDirtyRef.current = true;

        setScheme(next);

        if (schemeNeedsConfig(next) && !verificationConfig.header) {
            setVerificationConfig(DEFAULT_CONFIG_BY_SOURCE[source] ?? EMPTY_CONFIG);
        }
    }

    function handleTemplateFieldChange(field: TemplateTextField, value: string) {
        templateDirtyRef.current = true;

        setTemplateFields((prev) => ({ ...prev, [field]: value }));
    }

    function handlePayloadChange(text: string) {
        setPayloadText(text);

        try {
            JSON.parse(text);
            setPayloadValid(true);
        } catch {
            setPayloadValid(false);
        }
    }

    async function handleGenerateEndpoint() {
        setReserving(true);

        try {
            const reserved = await api.reserveWebhookSlug(source);

            setReservedSlug(reserved.slug);
            setSlugReservation(reserved.reservation);
        } catch {
            setSaveError('Could not reserve an endpoint URL. It will be assigned on save.');
        } finally {
            setReserving(false);
        }
    }

    function handleCopyEndpoint() {
        if (!slug) {
            return;
        }

        void navigator.clipboard.writeText(`${API_URL}/h/${slug}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    async function handleSave() {
        if (!topicName.trim()) {
            return setSaveError('Channel name is required');
        }

        if (!isValidTopicName(topicName.trim())) {
            return setSaveError(
                'Channel names use lowercase letters, numbers, dash, underscore and slash only',
            );
        }

        const hasStoredSecret = !!initialData?.hasSecret;

        if (scheme !== 'none' && !secret.trim() && !hasStoredSecret) {
            setActiveTab('signature');
            setInvalidField('secret');

            return setSaveError(
                `${VERIFICATION_LABELS[scheme]} signs its deliveries. Paste the signing secret from the provider, or set Scheme to None.`,
            );
        }

        if (scheme !== 'none' && schemeNeedsConfig(scheme) && !verificationConfig.header.trim()) {
            setActiveTab('signature');
            setInvalidField('header');

            return setSaveError(
                'Name the header the provider sends its signature in, for example x-signature.',
            );
        }

        setSaving(true);
        setSaveError(null);

        try {
            const channel = topicName.trim();
            const template = useTemplate ? JSON.stringify(templateFields) : null;

            const verification = {
                // Blank keeps the stored secret; switching to None clears it.
                secret: secret.trim() ? secret.trim() : scheme === 'none' ? null : undefined,
                verification: scheme,
                verificationConfig: schemeNeedsConfig(scheme)
                    ? JSON.stringify(verificationConfig)
                    : null,
            };

            if (isEdit && initialData) {
                await api.updateWebhook(initialData.id, {
                    name: name.trim() || defaultWebhookName(source),
                    template,
                    topicName: channel,
                    ...verification,
                });
            } else {
                const create = (reserved: { reservation: string; slug: string } | null) =>
                    api.createWebhook({
                        name: name.trim() || defaultWebhookName(source),
                        source,
                        template,
                        topicName: channel,
                        ...(reserved ?? {}),
                        ...verification,
                    });

                const reserved =
                    reservedSlug && slugReservation
                        ? { reservation: slugReservation, slug: reservedSlug }
                        : null;

                try {
                    await create(reserved);
                } catch (error) {
                    const message = error instanceof Error ? error.message : '';

                    if (
                        !message.includes('slug_taken') &&
                        !message.includes('invalid_slug_reservation')
                    ) {
                        throw error;
                    }

                    const retry = await api.reserveWebhookSlug(source);

                    setReservedSlug(retry.slug);
                    setSlugReservation(retry.reservation);
                    await create({ reservation: retry.reservation, slug: retry.slug });
                }
            }

            // Deliveries reach nobody without a subscription. subscribe() upserts, so skip
            // it when one exists: the update branch resets that channel's settings.
            if (!subscriptions.some((subscription) => subscription.topic.name === channel)) {
                try {
                    await subscribe(channel);
                } catch {
                    setSaving(false);

                    return setSaveError(
                        `Webhook saved, but subscribing to ${channel} failed. Subscribe from Channels to get notified.`,
                    );
                }
            }

            await queryClient.invalidateQueries({ queryKey: queryKeys.webhooks });

            await navigate({ to: '/app/webhooks' });
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Failed to save webhook');
        } finally {
            setSaving(false);
        }
    }

    // Sync initialData changes (edit mode hydration)
    useEffect(() => {
        if (!initialData) {
            return;
        }

        setTopicName(initialData.topicName);
        setSource((initialData.source as Source) || 'github');

        const template = (() => {
            try {
                return initialData.template
                    ? (JSON.parse(initialData.template) as WebhookTemplate)
                    : null;
            } catch {
                return null;
            }
        })();
        setTemplateFields(template ?? EMPTY_TEMPLATE);
        setUseTemplate(template !== null);

        setScheme(initialData.verification ?? 'none');
        setSecret('');
        setVerificationConfig(parseConfig(initialData.verificationConfig) ?? EMPTY_CONFIG);
        verificationDirtyRef.current = false;
    }, [initialData?.id]);

    // Seed the payload editor once deliveries resolve (the sample payload
    // arrives after mount, so it has its own effect to avoid resetting template edits).
    useEffect(() => {
        if (!initialData?.samplePayload) {
            return;
        }

        setPayloadText(initialData.samplePayload);
        setPayloadValid(true);
    }, [initialData?.samplePayload]);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {/* identity: source drives the sample payload, endpoint is the thing you copy */}
            <div className="grid grid-cols-[auto_1.6fr_1.1fr] items-start gap-5 border-b border-line px-6 py-4">
                <div>
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[1.3px] text-dim">
                        Source
                    </div>

                    <div className="flex gap-1.5">
                        {SOURCES.map((s) => (
                            <button
                                className="flex h-8 w-9.5 cursor-pointer items-center justify-center rounded-lg border font-mono text-[11px] font-bold"
                                key={s}
                                onClick={() => handleSourceChange(s)}
                                style={
                                    s === source
                                        ? {
                                              background:
                                                  'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                                              borderColor: 'var(--color-accent)',
                                              color: 'var(--color-accent)',
                                          }
                                        : {
                                              background: 'var(--color-elev)',
                                              borderColor: 'var(--color-line)',
                                              color: 'var(--color-dim)',
                                          }
                                }
                                title={s}
                                type="button"
                            >
                                {GLYPH[s]}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[1.3px] text-dim">
                        Endpoint URL
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-line bg-deep px-3 py-2">
                        <span className="flex-1 truncate font-mono text-[11.5px] text-muted">
                            {API_URL}/h/
                            <span className={slug ? 'text-accent' : 'text-faint'}>
                                {slug || 'assigned on save'}
                            </span>
                        </span>

                        {slug ? (
                            <button
                                className="flex shrink-0 cursor-pointer items-center text-faint hover:text-fg"
                                onClick={handleCopyEndpoint}
                                title={copied ? 'Copied!' : 'Copy endpoint URL'}
                                type="button"
                            >
                                {copied ? (
                                    <span className="font-mono text-[9px] text-success leading-none">
                                        ✓
                                    </span>
                                ) : (
                                    <Copy size={13} />
                                )}
                            </button>
                        ) : (
                            <button
                                className="shrink-0 cursor-pointer rounded-md border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1px] text-dim hover:text-fg disabled:cursor-default disabled:opacity-40"
                                disabled={reserving}
                                onClick={() => void handleGenerateEndpoint()}
                                title="Reserve this URL now, so you can configure the provider before saving"
                                type="button"
                            >
                                {reserving ? 'Reserving…' : 'Generate'}
                            </button>
                        )}
                    </div>
                </div>

                <WebhookChannelField
                    invalid={channelInvalid}
                    onChange={setTopicName}
                    source={source}
                    value={topicName}
                />
            </div>

            {/* editor split */}
            <div className="flex min-h-0 flex-1">
                {/* payload pane */}
                <div className="flex w-[44%] shrink-0 flex-col border-r border-line">
                    <div className="flex items-center px-5 py-3.5">
                        <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-dim">
                            Incoming Payload
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                            {editingPayload && !payloadValid && (
                                <span className="font-mono text-[10px] text-danger">
                                    invalid JSON
                                </span>
                            )}

                            <button
                                className="cursor-pointer rounded-md border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[1px] text-dim hover:text-fg disabled:cursor-default disabled:opacity-40"
                                disabled={editingPayload && !payloadValid}
                                onClick={() => setEditingPayload((editing) => !editing)}
                                type="button"
                            >
                                {editingPayload ? 'Done' : 'Edit'}
                            </button>
                        </div>
                    </div>
                    <div
                        className="mx-5 mb-5 flex-1 overflow-auto rounded-xl border border-line bg-deep p-3.5"
                        style={{
                            borderColor:
                                editingPayload && !payloadValid
                                    ? 'var(--color-danger)'
                                    : editingPayload
                                      ? 'var(--color-accent)'
                                      : undefined,
                        }}
                    >
                        {editingPayload ? (
                            <textarea
                                autoFocus
                                className="h-full w-full resize-none bg-transparent font-mono text-[12px] leading-relaxed text-fg outline-none"
                                onChange={(e) => handlePayloadChange(e.target.value)}
                                spellCheck={false}
                                value={payloadText}
                            />
                        ) : (
                            <JsonView data={activePayload} size={12} />
                        )}
                    </div>
                </div>

                {/* config pane: one tab at a time, preview pinned below */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <WebhookTabBar
                        active={activeTab}
                        onChange={setActiveTab}
                        signatureVerified={scheme !== 'none'}
                    />

                    <div className="min-h-0 flex-1 overflow-auto">
                        {activeTab === 'settings' && (
                            <WebhookSettingsTab
                                name={name}
                                onNameChange={setName}
                                placeholder={defaultWebhookName(source)}
                            />
                        )}

                        {activeTab === 'signature' && (
                            <VerificationFields
                                config={verificationConfig}
                                hasStoredSecret={!!initialData?.hasSecret}
                                invalidField={invalidField}
                                onConfigChange={(next) => {
                                    setInvalidField(null);
                                    setVerificationConfig(next);
                                }}
                                onSchemeChange={handleSchemeChange}
                                onSecretChange={(next) => {
                                    setInvalidField(null);
                                    setSecret(next);
                                }}
                                scheme={scheme}
                                secret={secret}
                            />
                        )}

                        {activeTab === 'template' && (
                            <WebhookTemplateTab
                                fields={templateFields}
                                onFieldChange={handleTemplateFieldChange}
                                onUseTemplateChange={setUseTemplate}
                                useTemplate={useTemplate}
                            />
                        )}
                    </div>

                    {/* preview stays put so editing any tab shows its effect immediately */}
                    <div className="shrink-0 border-t border-line bg-deep px-5 py-4">
                        <div className="mb-3 flex items-center">
                            <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-dim">
                                {showRaw ? 'Preview · Raw payload' : 'Preview · Notification'}
                            </span>
                            <div
                                className="ml-auto flex gap-1 rounded-lg border border-line bg-elev p-0.5"
                                style={{
                                    opacity: useTemplate ? 1 : 0.4,
                                    pointerEvents: useTemplate ? 'auto' : 'none',
                                }}
                            >
                                {(['pretty', 'raw'] as const).map((option) => (
                                    <button
                                        className="cursor-pointer rounded-md px-3 py-1 font-mono text-[11px] font-semibold transition-colors"
                                        key={option}
                                        onClick={() => setPreviewMode(option)}
                                        style={
                                            previewMode === option
                                                ? {
                                                      background: 'var(--color-accent)',
                                                      color: 'var(--color-bg)',
                                                  }
                                                : { color: 'var(--color-muted)' }
                                        }
                                        type="button"
                                    >
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!useTemplate && (
                            <div className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-elev px-3 py-2">
                                <span className="text-[12px] text-muted">
                                    No template. The raw payload is forwarded and pretty-printed as
                                    the body.
                                </span>
                            </div>
                        )}

                        {showRaw ? (
                            <div className="rounded-xl border border-line bg-deep p-3.5">
                                <div className="mb-2 font-mono text-[10.5px] text-dim">
                                    {topicName || 'channel'} · p3 ·{' '}
                                    <span className="text-faint">raw delivery</span>
                                </div>
                                <JsonView data={activePayload} size={11.5} />
                            </div>
                        ) : (
                            <NotifPreview {...rendered} />
                        )}
                    </div>
                </div>
            </div>

            {/* save bar */}
            <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-3">
                {saveError && (
                    <span className="font-mono text-[11px] text-danger">{saveError}</span>
                )}
                <button
                    className="rounded-md bg-accent px-4 py-1.5 text-[12px] font-semibold text-bg hover:bg-accent-dim disabled:opacity-50"
                    disabled={saving || !payloadValid}
                    onClick={() => void handleSave()}
                    type="button"
                >
                    {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save webhook'}
                </button>
            </div>
        </div>
    );
}

function parseConfig(raw: null | string | undefined): null | VerificationConfig {
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as VerificationConfig;
    } catch {
        return null;
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

function samplePayloadFor(source: string): string {
    return JSON.stringify(SOURCE_DATA[source]?.payload ?? {}, null, 2);
}
