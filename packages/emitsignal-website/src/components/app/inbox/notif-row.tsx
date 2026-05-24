import type { Message } from '#/lib/api';

import { Dot } from '#/components/ui/dot';
import { cn } from '#/lib/cn';
import { relativeTime } from '#/lib/format';

interface NotifRowProps {
    active?: boolean;
    message: Message;
    onClick?: () => void;
}

export function NotifRow({ active = false, message, onClick }: NotifRowProps) {
    const channel = message.topicName ?? message.topicId;

    return (
        <div
            className={cn(
                'flex cursor-pointer gap-2.5 border-b border-line px-4.5 py-3',
                active
                    ? 'border-l-[3px] border-l-accent bg-elev'
                    : 'border-l-[3px] border-l-transparent',
            )}
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
                <p className="mb-0.5 truncate text-[13px] font-semibold text-fg">{message.title}</p>
                <p className="truncate text-[12px] text-muted">{message.body}</p>
            </div>
        </div>
    );
}
