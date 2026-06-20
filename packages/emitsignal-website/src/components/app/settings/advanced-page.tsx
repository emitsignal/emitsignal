import { AlertTriangle, Check } from 'lucide-react';

import type { FeedStyle } from '#/lib/feed-style';

import { useDebugSections } from '#/ctx/debug-sections';
import { useFeedStyle } from '#/ctx/feed-style';
import { API_URL } from '#/lib/api';

import { SettingsButton } from './settings-button';
import { SettingsCard } from './settings-card';
import { SettingsField } from './settings-field';
import { SettingsGroup, SettingsRow } from './settings-group';
import { SettingsInput } from './settings-input';
import { SettingsPill } from './settings-pill';
import { SettingsToggle } from './settings-toggle';

const FEED_STYLE_OPTIONS: { description: string; label: string; value: FeedStyle }[] = [
    { description: 'Card rows with avatar, body preview and tags', label: 'Comfy', value: 'comfy' },
    {
        description: 'Chronological thread with priority dots on a vertical line',
        label: 'Timeline',
        value: 'timeline',
    },
    {
        description: 'Messages grouped by priority, highest first',
        label: 'Priority-first',
        value: 'priority',
    },
];

const DEBUG_OPTIONS: {
    description: string;
    key: 'showCurl' | 'showDelivery' | 'showPayload';
    label: string;
}[] = [
    {
        description: 'Show the raw message payload as JSON',
        key: 'showPayload',
        label: 'Show payload',
    },
    {
        description: 'Show the curl command to reproduce the message',
        key: 'showCurl',
        label: 'Show curl command',
    },
    { description: 'Show the delivery timeline', key: 'showDelivery', label: 'Show delivery' },
];

export function AdvancedPage() {
    const { feedStyle, setFeedStyle } = useFeedStyle();
    const { sections, setSection } = useDebugSections();

    return (
        <>
            <div className="mb-[26px] border-b border-line pb-[18px]">
                <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Advanced</h1>
                <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-muted">
                    Developer controls, experimental features, data residency, and irreversible
                    actions. Most teams never need to touch this page.
                </p>
            </div>

            <div>
                <SettingsCard
                    description="Low-level controls for how the API and webhooks behave for this workspace."
                    title="Developer"
                >
                    <div className="mb-2 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <SettingsField hint="Override for self-hosted / proxy" label="API base URL">
                            <SettingsInput monospace value={API_URL} />
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
                </SettingsCard>

                <SettingsCard
                    description="How signals are laid out in your inbox feed."
                    title="Feed"
                >
                    {FEED_STYLE_OPTIONS.map((option) => {
                        const active = option.value === feedStyle;

                        return (
                            <button
                                className="group flex w-full cursor-pointer items-start gap-3.5 border-b border-line py-3.5 text-left last:border-b-0"
                                key={option.value}
                                onClick={() => setFeedStyle(option.value)}
                                type="button"
                            >
                                <div className="min-w-0 flex-1">
                                    <div
                                        className={`text-[13.5px] font-medium transition-colors ${active ? 'text-accent' : 'text-fg group-hover:text-accent'}`}
                                    >
                                        {option.label}
                                    </div>
                                    <div className="mt-1 text-[12px] leading-relaxed text-muted">
                                        {option.description}
                                    </div>
                                </div>
                                {active ? (
                                    <Check className="mt-0.5 shrink-0 text-accent" size={16} />
                                ) : (
                                    <Check
                                        className="mt-0.5 shrink-0 text-dim opacity-0 transition-opacity group-hover:opacity-100"
                                        size={16}
                                    />
                                )}
                            </button>
                        );
                    })}
                </SettingsCard>

                <SettingsCard
                    description="Extra sections shown on a signal's detail view to help debug delivery."
                    title="Debug"
                >
                    {DEBUG_OPTIONS.map((option) => (
                        <SettingsToggle
                            checked={sections[option.key]}
                            description={option.description}
                            key={option.key}
                            label={option.label}
                            onChange={(next) => setSection(option.key, next)}
                        />
                    ))}
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
                </SettingsCard>

                <SettingsCard
                    className="border-danger/30"
                    description="These actions are permanent and affect every member of the workspace."
                    title="Danger zone"
                >
                    <SettingsGroup className="border-danger/20">
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
