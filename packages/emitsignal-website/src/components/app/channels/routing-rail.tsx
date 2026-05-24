import { Plus } from 'lucide-react';

import { Avatar } from '#/components/ui/avatar';
import { Code } from '#/components/ui/code';
import { SubHead } from '#/components/ui/sub-head';

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

const SUBSCRIBERS = ['alex', 'maya', 'jordan', 'on-call'];

export function RoutingRail() {
    return (
        <aside className="w-[320px] shrink-0 overflow-auto p-5.5">
            <SubHead>ROUTING</SubHead>
            <div className="mb-4.5">
                {RULES.map((rule, i) => (
                    <RuleRow key={i} rule={rule} />
                ))}
                <button className="flex items-center gap-1 pt-2.5 font-mono text-[11px] text-accent">
                    <Plus size={11} /> add rule
                </button>
            </div>

            <SubHead>SUBSCRIBERS · 4</SubHead>
            <div className="mb-4.5 flex flex-wrap gap-2">
                {SUBSCRIBERS.map((n) => (
                    <div
                        className="flex items-center gap-1.5 rounded-full border border-line bg-elev px-2 py-1"
                        key={n}
                    >
                        <Avatar name={n} rounded={100} size={18} />
                        <span className="text-[11.5px]">{n}</span>
                    </div>
                ))}
            </div>

            <SubHead>WEBHOOK</SubHead>
            <Code language="POST">https://emitsignal.com/alerts/prod</Code>
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
