import type { Message } from '#/lib/api';
import type { Priority } from '#/lib/priority';

import { Dot } from '#/components/ui/dot';
import { cn } from '#/lib/cn';
import { relativeTime } from '#/lib/format';
import { PRIORITY_LABEL, priorityHex } from '#/lib/priority';

interface PriorityRowProps {
    active?: boolean;
    message: Message;
    onClick?: () => void;
}

export function PriorityHeader({ level }: { level: Priority }) {
    return (
        <div className="flex items-center gap-1.5 px-4.5 pb-1.5 pt-4">
            <Dot level={level} size={6} />
            <span
                className="font-mono text-[10px] font-bold tracking-[0.5px]"
                style={{ color: priorityHex(level) }}
            >
                P{level}
            </span>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[1.5px] text-dim">
                {PRIORITY_LABEL[level]}
            </span>
            <span className="ml-1 h-px flex-1 bg-line" />
        </div>
    );
}

export function PriorityRow({ active = false, message, onClick }: PriorityRowProps) {
    const channel = message.topicName ?? message.topicId;

    return (
        <div
            className={cn(
                'flex cursor-pointer items-center gap-2.5 border-b border-line px-4.5 py-2.5',
                active
                    ? 'border-l-[3px] border-l-accent bg-elev'
                    : 'border-l-[3px] border-l-transparent',
            )}
            data-testid="priority-row"
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    onClick?.();
                }
            }}
        >
            <Dot level={message.priority} />
            <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-baseline gap-2">
                    <span className="font-mono text-[10.5px] text-dim">{channel}</span>
                    <span className="ml-auto font-mono text-[10px] text-dim">
                        {relativeTime(message.createdAt)}
                    </span>
                </div>
                <p className="truncate text-[13px] font-semibold text-fg">{message.title}</p>
                {message.body ? (
                    <p className="truncate text-[12px] text-muted">{message.body}</p>
                ) : null}
            </div>
        </div>
    );
}
