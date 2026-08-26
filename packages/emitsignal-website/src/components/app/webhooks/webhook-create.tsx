import type { VerificationConfig, VerificationScheme } from '@emitsignal/shared';

import {
    DEFAULT_CONFIG_BY_SOURCE,
    defaultVerificationForSource,
    schemeNeedsConfig,
} from '@emitsignal/shared';
import {
    applyTemplate as applyTemplateExact,
    sanitizeReplacements,
} from '@emitsignal/shared/webhook-template';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { Webhook, WebhookTemplate } from '#/lib/api';

import { api, API_URL } from '#/lib/api';
import { queryKeys } from '#/lib/query-client';

import type { ReplacementRow, TemplateTextField } from './template-fields';
import type { WebhookTab } from './webhook-tab-bar';

import { JsonView } from './json-view';
import { NotifPreview } from './notif-preview';
import { EMPTY_TEMPLATE, toReplacementMap, toReplacementRows } from './template-fields';
import { applyTemplate } from './template-string';
import { VerificationFields } from './verification-fields';
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

    const [activeTab, setActiveTab] = useState<WebhookTab>(isEdit ? 'template' : 'settings');
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
    const invalidTabs: WebhookTab[] = saveError && !topicName.trim() ? ['settings'] : [];

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
            setActiveTab('settings');

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
            {/* identity: source drives the sample payload, endpoint is the thing you copy */}
            <div className="grid grid-cols-[auto_1fr] items-end gap-5 border-b border-line px-6 py-4">
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
                            <span className="text-accent">
                                {isEdit ? initialData?.slug : 'assigned on save'}
                            </span>
                        </span>
                        <button
                            className="flex shrink-0 cursor-pointer items-center text-faint hover:text-fg disabled:cursor-default"
                            disabled={!isEdit}
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
                    </div>
                </div>
            </div>

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

                {/* config pane: one tab at a time, preview pinned below */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <WebhookTabBar
                        active={activeTab}
                        invalid={invalidTabs}
                        onChange={setActiveTab}
                    />

                    <div className="min-h-0 flex-1 overflow-auto">
                        {activeTab === 'settings' && (
                            <WebhookSettingsTab
                                error={saveError}
                                onTopicNameChange={setTopicName}
                                topicName={topicName}
                            />
                        )}

                        {activeTab === 'signature' && (
                            <VerificationFields
                                config={verificationConfig}
                                hasStoredSecret={!!initialData?.hasSecret}
                                onConfigChange={setVerificationConfig}
                                onSchemeChange={handleSchemeChange}
                                onSecretChange={setSecret}
                                scheme={scheme}
                                secret={secret}
                            />
                        )}

                        {activeTab === 'template' && (
                            <WebhookTemplateTab
                                fields={templateFields}
                                onFieldChange={handleTemplateFieldChange}
                                onReplacementRowsChange={handleReplacementRowsChange}
                                onUseTemplateChange={setUseTemplate}
                                replacementRows={replacementRows}
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
                    disabled={saving || (source === 'custom' && !customPayloadValid)}
                    onClick={() => void handleSave()}
                    type="button"
                >
                    {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save webhook'}
                </button>
            </div>
        </div>
    );
}
