import type { Message } from '#/lib/api';

import { Dot } from '#/components/ui/dot';
import { Pill } from '#/components/ui/pill';
import { SubHead } from '#/components/ui/sub-head';
import { relativeTime } from '#/lib/format';
import { priorityHex } from '#/lib/priority';

import { MetricChart } from './metric-chart';

const PRIORITY_LABELS: Record<number, string> = {
    1: 'PRIORITY 1 · LOW',
    2: 'PRIORITY 2',
    3: 'PRIORITY 3 · NORMAL',
    4: 'PRIORITY 4 · HIGH',
    5: 'PRIORITY 5 · MAX',
};

export function InboxPreview({ message }: { message: Message | null }) {
    if (!message) {
        return (
            <div className="flex min-w-0 flex-1 items-center justify-center p-7 font-mono text-[12px] text-dim">
                select a message to preview
            </div>
        );
    }

    const channel = message.topicName ?? message.topicId;
    const hasAcknowledge = message.actions.some((a) => a.type === 'acknowledge');
    const otherActions = message.actions.filter((a) => a.type !== 'acknowledge');

    return (
        <div className="min-w-0 flex-1 overflow-auto p-7">
            <div className="mb-3.5 flex items-center gap-2">
                <Dot level={message.priority} size={8} />
                <span
                    className="font-mono text-[11px] font-semibold uppercase tracking-[1.2px]"
                    style={{ color: priorityHex(message.priority) }}
                >
                    {PRIORITY_LABELS[message.priority] ?? `PRIORITY ${message.priority}`}
                </span>
                <span className="ml-auto font-mono text-[11px] text-dim">
                    {channel} · {relativeTime(message.createdAt)}
                </span>
            </div>

            <h2 className="m-0 mb-2.5 text-[26px] font-semibold tracking-[-0.6px]">
                {message.title}
            </h2>
            <p className="m-0 mb-4.5 whitespace-pre-wrap text-[14px] leading-[1.5] text-muted">
                {message.body}
            </p>

            {message.tags.length > 0 && (
                <div className="mb-4.5 flex flex-wrap gap-1.5">
                    {message.tags.map((tag) => (
                        <Pill
                            key={tag}
                            tone={tag === 'error' || tag === 'alert' ? 'danger' : 'accent'}
                        >
                            {tag}
                        </Pill>
                    ))}
                </div>
            )}

            {(hasAcknowledge || otherActions.length > 0) && (
                <div className="mb-6.5 flex gap-2">
                    {hasAcknowledge && (
                        <button className="rounded-md bg-accent px-3.5 py-2 text-[12.5px] font-semibold text-bg hover:bg-accent-dim">
                            Acknowledge
                        </button>
                    )}
                    {otherActions.map((a, i) => (
                        <a
                            className="rounded-md border border-line bg-elev px-3.5 py-2 text-[12.5px] text-fg no-underline hover:bg-elev-2"
                            href={a.url ?? '#'}
                            key={i}
                            rel="noopener noreferrer"
                            target={a.url ? '_blank' : undefined}
                        >
                            {a.label ?? a.type}
                        </a>
                    ))}
                </div>
            )}

            <SubHead>METRIC</SubHead>
            <MetricChart />

            <div className="h-4.5" />

            <SubHead>PAYLOAD</SubHead>
            <pre className="overflow-auto rounded-lg border border-line bg-deep p-4 font-mono text-[12px] leading-[1.6] text-muted">
                {JSON.stringify(
                    {
                        body: message.body,
                        id: message.id,
                        priority: message.priority,
                        tags: message.tags,
                        title: message.title,
                        topicId: message.topicId,
                        topicName: message.topicName,
                    },
                    null,
                    2,
                )}
            </pre>
        </div>
    );
}
