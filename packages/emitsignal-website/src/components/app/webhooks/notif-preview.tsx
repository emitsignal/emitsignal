import { Avatar } from '#/components/ui/avatar';
import { priorityHex } from '#/lib/priority';

interface NotifPreviewProps {
    body: string;
    channel: string;
    compact?: boolean;
    priority: number | string;
    tags?: string | string[];
    title: string;
}

export function NotifPreview({
    body,
    channel,
    compact = false,
    priority,
    tags = [],
    title,
}: NotifPreviewProps) {
    const tagList = Array.isArray(tags)
        ? tags
        : String(tags)
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean);

    const priorityValue = Number(priority);
    const priColor = priorityHex(priorityValue);

    return (
        <div
            className="relative overflow-hidden rounded-xl border border-line bg-bg"
            style={{ padding: compact ? '12px 14px' : '14px 16px' }}
        >
            <div
                className="absolute bottom-0 left-0 top-0 w-[3px]"
                style={{ background: priColor, opacity: priorityValue >= 4 ? 1 : 0.5 }}
            />
            <div className="flex gap-3">
                <Avatar name={channel} rounded={9} size={compact ? 30 : 36} />
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline gap-2">
                        <span className="font-mono text-[10.5px] text-dim">{channel}</span>
                        <span className="ml-auto font-mono text-[10px]" style={{ color: priColor }}>
                            p{priority}
                        </span>
                    </div>
                    <div
                        className="mb-1 font-semibold leading-snug"
                        style={{ fontSize: compact ? 13.5 : 14.5 }}
                    >
                        {title || <span className="text-dim">—</span>}
                    </div>
                    <div className="mb-2 text-[12.5px] leading-snug text-muted">{body}</div>
                    {tagList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {tagList.map((tag, index) => (
                                <span
                                    className="rounded border border-line bg-chip px-1.5 py-0.5 font-mono text-[10px] text-muted"
                                    key={index}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
