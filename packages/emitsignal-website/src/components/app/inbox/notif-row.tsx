import type { SampleNotif } from '#/lib/data';

import { Dot } from '#/components/ui/dot';
import { cn } from '#/lib/cn';

interface NotifRowProps {
    active?: boolean;
    notif: SampleNotif;
}

export function NotifRow({ active = false, notif }: NotifRowProps) {
    return (
        <div
            className={cn(
                'flex cursor-pointer gap-2.5 border-b border-line px-4.5 py-3',
                active
                    ? 'border-l-[3px] border-l-accent bg-elev'
                    : 'border-l-[3px] border-l-transparent',
            )}
        >
            <Dot level={notif.priority} />
            <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-baseline gap-2">
                    <span className="font-mono text-[10.5px] text-dim">{notif.channel}</span>
                    <span className="ml-auto font-mono text-[10px] text-dim">{notif.time}</span>
                </div>
                <p className="mb-0.5 truncate text-[13px] font-semibold text-fg">{notif.title}</p>
                <p className="truncate text-[12px] text-muted">{notif.body}</p>
            </div>
        </div>
    );
}
