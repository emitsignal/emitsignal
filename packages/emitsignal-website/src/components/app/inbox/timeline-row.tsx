import type { Message } from '#/lib/api';

import { Pill } from '#/components/ui/pill';
import { cn } from '#/lib/cn';
import { relativeTime } from '#/lib/format';
import { priorityHex } from '#/lib/priority';

interface TimelineRowProps {
    active?: boolean;
    isLast?: boolean;
    message: Message;
    onClick?: () => void;
}

export function TimelineDateLabel({ children }: { children: string }) {
    return (
        <div className="flex items-center py-2.5 pl-5">
            <div className="relative w-7 shrink-0 self-stretch">
                <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line" />
            </div>
            <span className="rounded border border-line bg-chip px-2 py-[3px] font-mono text-[10px] tracking-[0.8px] text-dim">
                {children}
            </span>
        </div>
    );
}

export function TimelineRow({
    active = false,
    isLast = false,
    message,
    onClick,
}: TimelineRowProps) {
    const channel = message.topicName ?? message.topicId;

    return (
        <div
            className={cn('flex cursor-pointer pl-5', active ? 'bg-elev' : '')}
            data-testid="timeline-row"
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    onClick?.();
                }
            }}
        >
            <div className="relative w-7 shrink-0">
                <div
                    className={cn(
                        'absolute left-1/2 top-0 w-px -translate-x-1/2 bg-line',
                        isLast ? 'h-1/2' : 'h-full',
                    )}
                />
                <span
                    className="absolute left-1/2 top-4 h-2 w-2 -translate-x-1/2 rounded-full"
                    style={{ background: priorityHex(message.priority) }}
                />
            </div>
            <div className="min-w-0 flex-1 border-b border-line py-3 pr-5">
                <div className="mb-1 flex items-baseline gap-2">
                    <span className="font-mono text-[10.5px] text-dim">{channel}</span>
                    <span className="ml-auto font-mono text-[10px] text-dim">
                        {relativeTime(message.createdAt)}
                    </span>
                </div>
                <p className="mb-0.5 text-[13px] font-semibold text-fg">{message.title}</p>
                {message.body ? (
                    <p className="mb-1.5 line-clamp-2 text-[12px] text-muted">{message.body}</p>
                ) : null}
                {message.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {message.tags.slice(0, 3).map((tag) => (
                            <Pill
                                key={tag}
                                tone={tag === 'error' || tag === 'alert' ? 'danger' : 'accent'}
                            >
                                {tag}
                            </Pill>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
