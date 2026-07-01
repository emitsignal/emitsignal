import { Plus } from 'lucide-react';

import { Code } from '#/components/ui/code';
import { SubHeading } from '#/components/ui/sub-head';
import { API_URL, type Subscription } from '#/lib/api';

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

interface Props {
    subscription: null | Subscription;
}

export function RoutingRail({ subscription }: Props) {
    const topicName = subscription?.topic.name ?? '';

    return (
        <aside className="w-[320px] shrink-0 overflow-auto p-5.5">
            <SubHeading>ROUTING</SubHeading>

            <div className="mb-4.5">
                {RULES.map((rule, index) => (
                    <RuleRow key={index} rule={rule} />
                ))}

                <button className="flex items-center gap-1 pt-2.5 font-mono text-[11px] text-accent">
                    <Plus size={11} /> add rule
                </button>
            </div>

            <SubHeading>PUBLISH A MESSAGE</SubHeading>

            <Code language="POST">
                {topicName ? `${API_URL}/topic/${topicName}` : 'subscribe to a channel first'}
            </Code>
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
