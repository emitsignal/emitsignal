import type { VerificationConfig, VerificationScheme } from '@emitsignal/shared';

import {
    DEFAULT_CONFIG_BY_SOURCE,
    defaultVerificationForSource,
    schemeNeedsConfig,
} from '@emitsignal/shared';
import {
    applyTemplate as applyTemplateExact,
    parsePlaceholder,
    sanitizeReplacements,
} from '@emitsignal/shared/webhook-template';
import { isKnownTransform, TRANSFORM_NAMES } from '@emitsignal/shared/webhook-transforms';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ChevronDown, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { Webhook, WebhookTemplate } from '#/lib/api';

import { Dot } from '#/components/ui/dot';
import { useSubscriptions } from '#/ctx/subscriptions';
import { api, API_URL } from '#/lib/api';
import { withAlpha } from '#/lib/color';
import { queryKeys } from '#/lib/query-client';

import { JsonView } from './json-view';
import { NotifPreview } from './notif-preview';
import { applyTemplate } from './template-string';
import { VerificationFields } from './verification-fields';

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

const EMPTY_TEMPLATE: WebhookTemplate = {
    body: '',
    link: '',
    linkLabel: '',
    priority: '3',
    replacements: {},
    tags: '',
    title: '',
};

const TEMPLATE_FIELDS = ['title', 'body', 'tags', 'link'] as const;

interface ReplacementRow {
    from: string;
    to: string;
}

type TemplateTextField = Exclude<keyof WebhookTemplate, 'replacements'>;

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

function toReplacementMap(rows: ReplacementRow[]): Record<string, string> {
    return Object.fromEntries(
        rows.filter((row) => row.from.trim()).map((row) => [row.from, row.to]),
    );
}

function toReplacementRows(replacements: Record<string, string> | undefined): ReplacementRow[] {
    return Object.entries(replacements ?? {}).map(([from, to]) => ({ from, to }));
}

// ── Props ─────────────────────────────────────────────────────────────────────

// Filters are ignored at delivery time when misspelled, so the editor is where a typo surfaces.
function unknownFiltersIn(input: string): string[] {
    const names = [...input.matchAll(/\{\{\s*([^}]+)\s*\}\}/g)].flatMap(([, raw]) =>
        parsePlaceholder(raw!).filters.map((filter) => filter.name),
    );

    return [...new Set(names.filter((name) => !isKnownTransform(name)))];
}

const EMPTY_CONFIG: VerificationConfig = {
    algorithm: 'sha256',
    encoding: 'hex',
    header: '',
    prefix: '',
};

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

const EMPTY_PAYLOAD = '{\n  \n}';

// ── Component ─────────────────────────────────────────────────────────────────

export function WebhookCreate({ initialData }: WebhookCreateProps = {}) {
    const { subscriptions } = useSubscriptions();
    const isEdit = !!initialData;
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

    const [copied, setCopied] = useState(false);
    const [customPayloadText, setCustomPayloadText] = useState(
        initialData?.samplePayload ?? EMPTY_PAYLOAD,
    );
    const [customPayloadValid, setCustomPayloadValid] = useState(true);
    const [previewMode, setPreviewMode] = useState<'pretty' | 'raw'>('pretty');
    const [saveError, setSaveError] = useState<null | string>(null);
    const [saving, setSaving] = useState(false);
    const [secret, setSecret] = useState('');
    const [scheme, setScheme] = useState<VerificationScheme>(
        initialData?.verification ?? defaultVerificationForSource(initialSource),
    );
    const [source, setSource] = useState<Source>(initialSource);
    const [templateFields, setTemplateFields] = useState<WebhookTemplate>(
        initialTemplate ?? EMPTY_TEMPLATE,
    );
    const [topicName, setTopicName] = useState(initialData?.topicName ?? '');
    const [useTemplate, setUseTemplate] = useState(initialTemplate !== null);
    const [replacementRows, setReplacementRows] = useState<ReplacementRow[]>(
        toReplacementRows((initialTemplate ?? EMPTY_TEMPLATE).replacements),
    );
    const templateDirtyRef = useRef(false);

    const [verificationConfig, setVerificationConfig] = useState<VerificationConfig>(
        parseConfig(initialData?.verificationConfig) ??
            DEFAULT_CONFIG_BY_SOURCE[initialSource] ??
            EMPTY_CONFIG,
    );
    const verificationDirtyRef = useRef(false);

    // Active payload for preview
    const activePayload: Record<string, unknown> =
        source === 'custom'
            ? (() => {
                  try {
                      return JSON.parse(customPayloadText) as Record<string, unknown>;
                  } catch {
                      return {};
                  }
              })()
            : SOURCE_DATA[source]!.payload;

    const showRaw = !useTemplate || previewMode === 'raw';

    const replacements = sanitizeReplacements(templateFields.replacements);

    const rendered = {
        body: applyTemplate(templateFields.body ?? '', activePayload, replacements),
        channel: topicName || `${source}/channel`,
        link: applyTemplate(templateFields.link ?? '', activePayload, replacements).trim(),
        linkLabel: applyTemplateExact(templateFields.linkLabel ?? '', activePayload, {
            replacements,
        }),
        priority: Number(templateFields.priority ?? '3'),
        tags: applyTemplate(templateFields.tags ?? '', activePayload, replacements),
        title: applyTemplate(templateFields.title ?? '', activePayload, replacements),
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

        templateDirtyRef.current = false;

        if (!verificationDirtyRef.current) {
            setScheme(defaultVerificationForSource(source));
            setVerificationConfig(DEFAULT_CONFIG_BY_SOURCE[source] ?? EMPTY_CONFIG);
        }
    }

    function handleSchemeChange(next: VerificationScheme) {
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

    function handleReplacementRowsChange(rows: ReplacementRow[]) {
        templateDirtyRef.current = true;

        setReplacementRows(rows);
        setTemplateFields((prev) => ({ ...prev, replacements: toReplacementMap(rows) }));
    }

    function handleCustomPayloadChange(text: string) {
        setCustomPayloadText(text);

        try {
            JSON.parse(text);
            setCustomPayloadValid(true);
        } catch {
            setCustomPayloadValid(false);
        }
    }

    function handleCopyEndpoint() {
        if (!isEdit || !initialData?.slug) {
            return;
        }

        void navigator.clipboard.writeText(`${API_URL}/h/${initialData.slug}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    async function handleSave() {
        if (!topicName.trim()) {
            return setSaveError('Channel name is required');
        }

        const hasStoredSecret = !!initialData?.hasSecret;

        if (scheme !== 'none' && !secret.trim() && !hasStoredSecret) {
            return setSaveError('Paste the signing secret, or set verification to None');
        }

        if (scheme !== 'none' && schemeNeedsConfig(scheme) && !verificationConfig.header.trim()) {
            return setSaveError('A header name is required for this verification scheme');
        }

        setSaving(true);
        setSaveError(null);

        try {
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
                    name: `${source} webhook`,
                    template,
                    topicName: topicName.trim(),
                    ...verification,
                });
            } else {
                await api.createWebhook({
                    name: `${source} webhook`,
                    source,
                    template,
                    topicName: topicName.trim(),
                    ...verification,
                });
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

    // Seed the custom payload editor once deliveries resolve (the sample payload
    // arrives after mount, so it has its own effect to avoid resetting template edits).
    useEffect(() => {
        if (!initialData?.samplePayload) {
            return;
        }

        setCustomPayloadText(initialData.samplePayload);
        setCustomPayloadValid(true);
    }, [initialData?.samplePayload]);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="grid grid-cols-[1.1fr_1.6fr_1.1fr] gap-5 border-b border-line px-6 py-4">
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
                            >
                                {GLYPH[s]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Endpoint URL */}
                <div>
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[1.3px] text-dim">
                        Endpoint URL
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-line bg-deep px-3 py-2">
                        <span className="flex-1 truncate font-mono text-[11.5px] text-muted">
                            {API_URL}/h/
                            <span className="text-accent">
                                {isEdit ? initialData?.slug : 'assigned on save'}
                            </span>
                        </span>
                        <button
                            className="flex shrink-0 cursor-pointer items-center text-faint hover:text-fg disabled:cursor-default"
                            disabled={!isEdit}
                            onClick={handleCopyEndpoint}
                            title={copied ? 'Copied!' : 'Copy endpoint URL'}
                        >
                            {copied ? (
                                <span className="font-mono text-[9px] text-success leading-none">
                                    ✓
                                </span>
                            ) : (
                                <Copy size={13} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Channel */}
                <div>
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-[1.3px] text-dim">
                        Publish to channel
                    </div>
                    <div
                        className="flex items-center gap-2 rounded-lg border bg-elev px-3 py-2"
                        style={{
                            borderColor:
                                saveError && !topicName.trim()
                                    ? 'var(--color-danger)'
                                    : 'var(--color-line)',
                        }}
                    >
                        <Dot level={2} size={6} />

                        <select
                            className="flex-1 bg-transparent font-mono text-[12px] text-fg outline-none"
                            onChange={(e) => setTopicName(e.target.value)}
                            value={topicName}
                        >
                            <option disabled value="">
                                Select a channel…
                            </option>

                            {subscriptions.map((subscription) => (
                                <option key={subscription.id} value={subscription.topic.name}>
                                    {subscription.topic.displayName}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none text-dim" size={13} />
                    </div>

                    {saveError && (
                        <div className="mt-1 font-mono text-[10.5px] text-danger">{saveError}</div>
                    )}
                </div>
            </div>

            <VerificationFields
                config={verificationConfig}
                hasStoredSecret={!!initialData?.hasSecret}
                onConfigChange={setVerificationConfig}
                onSchemeChange={handleSchemeChange}
                onSecretChange={setSecret}
                scheme={scheme}
                secret={secret}
            />

            {/* editor split */}
            <div className="flex min-h-0 flex-1">
                {/* payload pane */}
                <div className="flex w-[44%] shrink-0 flex-col border-r border-line">
                    <div className="flex items-center px-5 py-3.5">
                        <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-dim">
                            Incoming Payload
                        </span>
                        <span className="ml-auto font-mono text-[10px] text-faint">
                            {source === 'custom' ? 'editable' : 'POST · example payload'}
                        </span>
                    </div>
                    <div
                        className="mx-5 mb-5 flex-1 overflow-auto rounded-xl border border-line bg-deep p-3.5"
                        style={{
                            borderColor:
                                source === 'custom' && !customPayloadValid
                                    ? 'var(--color-danger)'
                                    : undefined,
                        }}
                    >
                        {source === 'custom' ? (
                            <textarea
                                className="h-full w-full resize-none bg-transparent font-mono text-[12px] leading-relaxed text-fg outline-none"
                                onChange={(e) => handleCustomPayloadChange(e.target.value)}
                                spellCheck={false}
                                value={customPayloadText}
                            />
                        ) : (
                            <JsonView data={SOURCE_DATA[source]!.payload} size={12} />
                        )}
                    </div>
                </div>

                {/* template + preview pane */}
                <div className="flex min-w-0 flex-1 flex-col overflow-auto">
                    {/* template toggle */}
                    <div className="flex items-center px-5 py-3.5">
                        <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-dim">
                            Template
                        </span>

                        <button
                            className="ml-auto flex cursor-pointer items-center gap-2"
                            onClick={() => setUseTemplate((v) => !v)}
                        >
                            <span
                                className="font-mono text-[11px]"
                                style={{
                                    color: useTemplate ? 'var(--color-accent)' : 'var(--color-dim)',
                                }}
                            >
                                {useTemplate ? 'Using template' : 'Raw passthrough'}
                            </span>
                            <div
                                className="flex items-center rounded-full p-0.5 transition-colors"
                                style={{
                                    background: useTemplate
                                        ? 'var(--color-accent)'
                                        : 'var(--color-line)',
                                    height: 21,
                                    justifyContent: useTemplate ? 'flex-end' : 'flex-start',
                                    width: 36,
                                }}
                            >
                                <div className="h-[17px] w-[17px] rounded-full bg-fg" />
                            </div>
                        </button>
                    </div>

                    {/* template fields (editable) */}
                    <div
                        className="px-5 transition-opacity"
                        style={{
                            opacity: useTemplate ? 1 : 0.4,
                            pointerEvents: useTemplate ? 'auto' : 'none',
                        }}
                    >
                        {TEMPLATE_FIELDS.map((field) => {
                            const unknownFilters = unknownFiltersIn(templateFields[field] ?? '');

                            return (
                                <div className="mb-2.5" key={field}>
                                    <div className="mb-1 font-mono text-[10px] uppercase tracking-[1px] text-dim">
                                        {field}
                                    </div>
                                    <input
                                        className="w-full rounded-lg border border-line bg-elev px-3 py-2 font-mono text-[12.5px] text-fg outline-none placeholder:text-faint focus:border-accent/50"
                                        onChange={(e) =>
                                            handleTemplateFieldChange(field, e.target.value)
                                        }
                                        placeholder={`{{${field === 'title' ? 'event.type' : field === 'body' ? 'event.description' : field === 'tags' ? 'source, tag' : 'event.url'}}}`}
                                        value={templateFields[field] ?? ''}
                                    />
                                    {unknownFilters.length > 0 && (
                                        <div className="mt-1 font-mono text-[10.5px] text-warn">
                                            Unknown filter{unknownFilters.length > 1 ? 's' : ''}:{' '}
                                            {unknownFilters.join(', ')} — ignored on delivery.
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {(templateFields.link ?? '') !== '' && (
                            <div className="mb-2.5">
                                <div className="mb-1 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[1px] text-dim">
                                    Button label
                                    <span className="normal-case tracking-normal text-faint">
                                        optional · defaults to “View”
                                    </span>
                                </div>
                                <input
                                    className="w-full rounded-lg border border-line bg-elev px-3 py-2 font-mono text-[12.5px] text-fg outline-none placeholder:text-faint focus:border-accent/50"
                                    onChange={(e) =>
                                        handleTemplateFieldChange('linkLabel', e.target.value)
                                    }
                                    placeholder="View"
                                    value={templateFields.linkLabel ?? ''}
                                />
                            </div>
                        )}

                        <div className="mb-2.5">
                            <div className="mb-1 font-mono text-[10px] uppercase tracking-[1px] text-dim">
                                Priority
                            </div>

                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((priority) => (
                                    <PriorityChip
                                        active={
                                            String(priority) === (templateFields.priority ?? '3')
                                        }
                                        key={priority}
                                        onClick={() =>
                                            handleTemplateFieldChange('priority', String(priority))
                                        }
                                        value={priority}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mb-2.5">
                            <div className="mb-1 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[1px] text-dim">
                                Replacements
                                <span className="normal-case tracking-normal text-faint">
                                    optional · used by the {'{{ value | map }}'} filter
                                </span>
                            </div>

                            {replacementRows.map((row, index) => (
                                <div className="mb-1 flex gap-1" key={index}>
                                    <input
                                        className="w-full rounded-lg border border-line bg-elev px-3 py-2 font-mono text-[12.5px] text-fg outline-none placeholder:text-faint focus:border-accent/50"
                                        onChange={(e) =>
                                            handleReplacementRowsChange(
                                                replacementRows.map((current, position) =>
                                                    position === index
                                                        ? { ...current, from: e.target.value }
                                                        : current,
                                                ),
                                            )
                                        }
                                        placeholder="customer.subscription.created"
                                        value={row.from}
                                    />
                                    <input
                                        className="w-full rounded-lg border border-line bg-elev px-3 py-2 font-mono text-[12.5px] text-fg outline-none placeholder:text-faint focus:border-accent/50"
                                        onChange={(e) =>
                                            handleReplacementRowsChange(
                                                replacementRows.map((current, position) =>
                                                    position === index
                                                        ? { ...current, to: e.target.value }
                                                        : current,
                                                ),
                                            )
                                        }
                                        placeholder="Assinatura criada"
                                        value={row.to}
                                    />
                                    <button
                                        className="rounded-lg border border-line px-2.5 font-mono text-[12px] text-dim hover:text-fg"
                                        onClick={() =>
                                            handleReplacementRowsChange(
                                                replacementRows.filter(
                                                    (_, position) => position !== index,
                                                ),
                                            )
                                        }
                                        type="button"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            <button
                                className="rounded-lg border border-line px-2.5 py-1.5 font-mono text-[11px] text-dim hover:text-fg"
                                onClick={() =>
                                    handleReplacementRowsChange([
                                        ...replacementRows,
                                        { from: '', to: '' },
                                    ])
                                }
                                type="button"
                            >
                                + Add replacement
                            </button>
                        </div>

                        <details className="mb-3">
                            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[1px] text-dim">
                                Available filters
                            </summary>
                            <div className="mt-1.5 font-mono text-[11px] leading-relaxed text-faint">
                                {TRANSFORM_NAMES.join(' · ')}
                                <div className="mt-1.5 text-dim">
                                    {"{{ created | date:'YYYY-MM-DD HH:mm' }}"}
                                </div>
                                <div className="text-dim">
                                    {
                                        "{{ data.object.items.data.*.price.unit_amount | divide:100 | currency:'usd' }}"
                                    }
                                </div>
                                <div className="text-dim">{'{{ type | map }}'}</div>
                            </div>
                        </details>
                    </div>

                    {/* preview */}
                    <div className="border-t border-line bg-deep px-5 py-4">
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
            <div className="flex justify-end gap-2 border-t border-line px-6 py-3">
                <button
                    className="rounded-md bg-accent px-4 py-1.5 text-[12px] font-semibold text-bg hover:bg-accent-dim disabled:opacity-50"
                    disabled={saving || (source === 'custom' && !customPayloadValid)}
                    onClick={() => void handleSave()}
                >
                    {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save webhook'}
                </button>
            </div>
        </div>
    );
}

function PriorityChip({
    active,
    onClick,
    value,
}: {
    active: boolean;
    onClick: () => void;
    value: number;
}) {
    const hex = `var(--color-p${value})`;

    return (
        <button
            className="flex flex-1 cursor-pointer items-center justify-center rounded-md border py-1.5 font-mono text-[11.5px] font-semibold"
            onClick={onClick}
            style={
                active
                    ? { background: withAlpha(hex, 13), borderColor: hex, color: hex }
                    : {
                          background: 'var(--color-elev)',
                          borderColor: 'var(--color-line)',
                          color: 'var(--color-dim)',
                      }
            }
        >
            {value}
        </button>
    );
}
