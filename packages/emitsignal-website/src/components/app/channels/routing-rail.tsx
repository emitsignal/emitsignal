import type { PublishExampleMessage } from '@emitsignal/shared/publish-example';

import { buildCliExample, buildCurlExample } from '@emitsignal/shared/publish-example';
import { ExternalLink, Plus } from 'lucide-react';
import { useState } from 'react';

import { Code } from '#/components/ui/code';
import { CopyButton } from '#/components/ui/copy-button';
import { SubHeading } from '#/components/ui/sub-head';
import { PUBLISH_BASE_URL, type Subscription } from '#/lib/api';
import { DOCS_URL } from '#/lib/links';

interface RoutingRule {
    color: string;
    condition: string;
    target: string;
}

const RULES: RoutingRule[] = [
    { color: 'text-danger', condition: 'priority:5', target: 'push + sms + slack #oncall' },
    { color: 'text-warn', condition: 'priority:4', target: 'push + slack #alerts' },
    { color: 'text-accent', condition: 'priority:<=3', target: 'inbox only' },
    { color: 'text-danger', condition: 'tag:sev2', target: 'page on-call rotation' },
];

const ROUTING_ENABLED = false;

const EXAMPLE_MESSAGES: PublishExampleMessage[] = [
    { body: 'Build 4821 is live.', priority: 4, tags: ['deploy'], title: 'Deploy finished' },
    { body: 'p95 is over 800ms.', priority: 5, tags: ['api', 'sev2'], title: 'Latency spike' },
    { body: 'Nightly snapshot stored.', priority: 2, tags: ['cron'], title: 'Backup done' },
    { body: 'Disk at 91% on db-01.', priority: 4, tags: ['infra'], title: 'Disk pressure' },
    { body: '12 signups since midnight.', priority: 3, tags: ['growth'], title: 'Daily digest' },
];

type SnippetTab = 'cli' | 'curl';

interface SnippetTabDefinition {
    docsHref: string;
    docsLabel: string;
    id: SnippetTab;
    label: string;
}

function exampleForTopic(topicName: string): PublishExampleMessage {
    let hash = 0;

    for (let index = 0; index < topicName.length; index += 1) {
        hash = (hash * 31 + topicName.charCodeAt(index)) % 1000003;
    }

    return EXAMPLE_MESSAGES[hash % EXAMPLE_MESSAGES.length];
}

const SNIPPET_TABS: SnippetTabDefinition[] = [
    {
        docsHref: `${DOCS_URL}/api/publish`,
        docsLabel: 'publish API reference',
        id: 'curl',
        label: 'curl',
    },
    {
        docsHref: `${DOCS_URL}/cli/publish`,
        docsLabel: 'es publish reference',
        id: 'cli',
        label: 'es cli',
    },
];

interface Props {
    subscription: null | Subscription;
}

export function RoutingRail({ subscription }: Props) {
    const [snippetTab, setSnippetTab] = useState<SnippetTab>('curl');

    const description = (
        subscription?.settings.description ?? subscription?.topic.description
    )?.trim();

    const topicName = subscription?.topic.name ?? '';

    const activeTab = SNIPPET_TABS.find((tab) => tab.id === snippetTab) ?? SNIPPET_TABS[0];
    const example = exampleForTopic(topicName);

    const snippet =
        snippetTab === 'curl'
            ? buildCurlExample({
                  baseUrl: PUBLISH_BASE_URL,
                  message: example,
                  style: 'headers',
                  topicName,
              })
            : buildCliExample({ bin: 'es', message: example, topicName, wrap: true });

    return (
        <aside className="w-[320px] shrink-0 overflow-auto p-5.5">
            {description && (
                <div className="mb-4.5">
                    <SubHeading>DESCRIPTION</SubHeading>

                    <p className="text-[12.5px] leading-[1.55] text-muted">{description}</p>
                </div>
            )}

            {ROUTING_ENABLED && (
                <div className="mb-4.5">
                    <SubHeading>ROUTING</SubHeading>

                    {RULES.map((rule, index) => (
                        <RuleRow key={index} rule={rule} />
                    ))}

                    <button className="flex items-center gap-1 pt-2.5 font-mono text-[11px] text-accent">
                        <Plus size={11} /> add rule
                    </button>
                </div>
            )}

            <SubHeading>PUBLISH A MESSAGE</SubHeading>

            {topicName ? (
                <>
                    <div className="mb-2 flex items-center gap-1.5">
                        {SNIPPET_TABS.map((tab) => (
                            <button
                                className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] ${
                                    tab.id === snippetTab
                                        ? 'bg-accent/10 text-accent'
                                        : 'text-dim hover:bg-elev hover:text-muted'
                                }`}
                                key={tab.id}
                                onClick={() => setSnippetTab(tab.id)}
                                type="button"
                            >
                                {tab.label}
                            </button>
                        ))}

                        <CopyButton className="ml-auto" value={snippet} />
                    </div>

                    <Code>{snippet}</Code>
                </>
            ) : (
                <Code>subscribe to a channel first</Code>
            )}

            <a
                className="mt-2.5 inline-flex items-center gap-1.5 font-mono text-[11px] text-accent no-underline hover:underline"
                href={activeTab.docsHref}
                rel="noopener noreferrer"
                target="_blank"
            >
                {activeTab.docsLabel}
                <ExternalLink size={10} />
            </a>
        </aside>
    );
}

function RuleRow({ rule }: { rule: RoutingRule }) {
    return (
        <div className="flex items-center gap-2.5 border-b border-line py-2.5">
            <span
                className={`rounded border border-line bg-chip px-1.5 py-0.5 font-mono text-[11px] ${rule.color}`}
            >
                {rule.condition}
            </span>

            <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-muted">
                → {rule.target}
            </span>
        </div>
    );
}
