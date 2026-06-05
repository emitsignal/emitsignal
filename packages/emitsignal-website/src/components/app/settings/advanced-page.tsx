import { AlertTriangle, ArrowRight, Copy } from 'lucide-react';

import { SettingsButton } from './settings-button';
import { SettingsCard } from './settings-card';
import { SettingsField } from './settings-field';
import { SettingsGroup, SettingsRow } from './settings-group';
import { SettingsInput } from './settings-input';
import { SettingsPill } from './settings-pill';
import { SettingsToggle } from './settings-toggle';

const DATA_REGIONS = [
    { id: 'eu', isActive: true, label: 'EU · Frankfurt', meta: 'eu-central-1' },
    { id: 'us', isActive: false, label: 'US · Virginia', meta: 'us-east-1' },
    { id: 'ap', isActive: false, label: 'APAC · Singapore', meta: 'ap-southeast-1' },
] as const;

export function AdvancedPage() {
    return (
        <>
            <div className="mb-[26px] border-b border-line pb-[18px]">
                <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Advanced</h1>
                <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-muted">
                    Developer controls, experimental features, data residency, and irreversible
                    actions. Most teams never need to touch this page.
                </p>
            </div>

            <div className="max-w-[760px]">
                <SettingsCard
                    description="Low-level controls for how the API and webhooks behave for this workspace."
                    title="Developer"
                >
                    <div className="mb-2 grid grid-cols-2 gap-3.5">
                        <SettingsField hint="Override for self-hosted / proxy" label="API base URL">
                            <SettingsInput monospace value="https://api.emitsignal.sh" />
                        </SettingsField>
                        <SettingsField hint="Per key, requests / minute" label="Default rate limit">
                            <SettingsInput monospace suffix="req/min" value="600" />
                        </SettingsField>
                    </div>
                    <SettingsField
                        hint="Used to verify the X-Signal-Signature HMAC on every outbound webhook"
                        label="Webhook signing secret"
                    >
                        <SettingsInput monospace suffix="rotate" value="whsec_9f2a••••c41e" />
                    </SettingsField>
                    <div className="mt-4">
                        <SettingsToggle
                            defaultOn
                            description="POST back to your endpoint when a signal is delivered or read"
                            label="Send delivery receipts to webhooks"
                        />
                        <SettingsToggle
                            defaultOn
                            description="Adds the full unparsed body — increases request size"
                            label="Include raw payload in webhooks"
                        />
                        <SettingsToggle
                            description="Reject webhook targets with self-signed certificates"
                            label="Strict TLS verification on egress"
                        />
                    </div>
                </SettingsCard>

                <SettingsCard
                    action={<SettingsPill tone="warn">PREVIEW</SettingsPill>}
                    description="Opt into features still in preview. They can change or disappear without notice."
                    title="Experimental features"
                >
                    <SettingsToggle
                        defaultOn
                        description="ML-driven grouping of cascading alerts. Replaces the 60s window rule."
                        label="Smart batching v2"
                    />
                    <SettingsToggle
                        description="Reply to a signal from the notification — routes back to the publisher"
                        label="Inline signal replies"
                    />
                    <SettingsToggle
                        description="Write channel rules in plain English instead of expressions"
                        label="Natural-language filters"
                    />
                    <SettingsToggle
                        description="Route through the nearest PoP. Adds ~12 new regions."
                        label="Edge delivery (beta regions)"
                    />
                </SettingsCard>

                <SettingsCard
                    description="Where signals, payloads, and logs are stored at rest. Changing region triggers a full migration."
                    title="Data residency"
                >
                    <div className="grid grid-cols-3 gap-3">
                        {DATA_REGIONS.map((region) => (
                            <div
                                className={`rounded-lg border p-3.5 ${
                                    region.isActive
                                        ? 'border-accent bg-accent/10'
                                        : 'border-line bg-bg'
                                }`}
                                key={region.id}
                            >
                                <div className="mb-1.5 flex items-center gap-2">
                                    <div
                                        className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full border ${
                                            region.isActive ? 'border-accent' : 'border-dim'
                                        }`}
                                    >
                                        {region.isActive ? (
                                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                        ) : null}
                                    </div>
                                    <span
                                        className={`text-[13px] font-medium ${
                                            region.isActive ? 'text-accent' : 'text-fg'
                                        }`}
                                    >
                                        {region.label}
                                    </span>
                                </div>
                                <div className="pl-5 font-mono text-[10.5px] text-dim">
                                    {region.meta}
                                </div>
                            </div>
                        ))}
                    </div>
                </SettingsCard>

                <SettingsCard
                    description="Take your data with you, any time."
                    title="Data portability"
                >
                    <SettingsGroup>
                        <SettingsRow>
                            <div className="flex-1">
                                <div className="text-[13.5px] font-medium">
                                    Export full workspace archive
                                </div>
                                <div className="mt-0.5 text-[12px] text-muted">
                                    Every channel, signal, key, and rule as a JSON + NDJSON bundle
                                </div>
                            </div>
                            <SettingsButton icon={Copy} variant="ghost">
                                Request export
                            </SettingsButton>
                        </SettingsRow>
                        <SettingsRow last>
                            <div className="flex-1">
                                <div className="text-[13.5px] font-medium">
                                    Import from another provider
                                </div>
                                <div className="mt-0.5 text-[12px] text-muted">
                                    Map channels & subscribers from PagerDuty, ntfy, or a CSV
                                </div>
                            </div>
                            <SettingsButton icon={ArrowRight} variant="ghost">
                                Start import
                            </SettingsButton>
                        </SettingsRow>
                    </SettingsGroup>
                </SettingsCard>

                <SettingsCard
                    className="border-danger/30"
                    description="These actions are permanent and affect every member of the workspace."
                    title="Danger zone"
                >
                    <SettingsGroup className="border-danger/20">
                        <SettingsRow>
                            <div className="flex-1">
                                <div className="text-[13.5px] font-semibold">
                                    Transfer ownership
                                </div>
                                <div className="mt-0.5 text-[12px] text-muted">
                                    Hand this workspace to another admin. You&apos;ll keep your
                                    member seat.
                                </div>
                            </div>
                            <SettingsButton size="sm" variant="ghost">
                                Transfer
                            </SettingsButton>
                        </SettingsRow>
                        <SettingsRow>
                            <div className="flex-1">
                                <div className="text-[13.5px] font-semibold text-danger">
                                    Purge all signals
                                </div>
                                <div className="mt-0.5 text-[12px] text-muted">
                                    Permanently delete every signal across all channels. Channels
                                    stay.
                                </div>
                            </div>
                            <SettingsButton size="sm" variant="danger">
                                Purge
                            </SettingsButton>
                        </SettingsRow>
                        <SettingsRow last>
                            <div className="flex-1">
                                <div className="text-[13.5px] font-semibold text-danger">
                                    Delete workspace
                                </div>
                                <div className="mt-0.5 text-[12px] text-muted">
                                    Removes acme-engineering, all channels, keys, members, and
                                    billing. Irreversible.
                                </div>
                            </div>
                            <SettingsButton size="sm" variant="danger">
                                Delete
                            </SettingsButton>
                        </SettingsRow>
                    </SettingsGroup>
                    <div className="mt-3.5 flex items-center gap-2 font-mono text-[11px] text-danger">
                        <AlertTriangle className="shrink-0" size={13} />
                        Deleting requires typing the workspace slug and re-authenticating.
                    </div>
                </SettingsCard>
            </div>
        </>
    );
}
