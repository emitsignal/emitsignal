import { createFileRoute } from '@tanstack/react-router';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

import type { Message } from '#/lib/api';

import { NotifRow } from '#/components/app/inbox/notif-row';
import { InboxPreview } from '#/components/app/inbox/preview';
import { Toolbar } from '#/components/app/toolbar';
import { useFeed } from '#/hooks/use-emit-signal';

export const Route = createFileRoute('/app/')({ component: InboxPage });

function InboxPage() {
    const { loading, messages, subscriptions } = useFeed();
    const [selectedId, setSelectedId] = useState<null | string>(null);

    const channelCount = subscriptions.length;
    const subtitle = loading
        ? 'loading…'
        : `${messages.length} messages · ${channelCount} channels active`;

    const selected = messages.find((m) => m.id === selectedId) ?? null;

    return (
        <>
            <Toolbar
                actions={
                    <>
                        <SearchInput />
                        <SubscribeButton />
                    </>
                }
                subtitle={subtitle}
                title="Inbox"
            />

            <div className="flex min-h-0 flex-1">
                <NotifList messages={messages} onSelect={setSelectedId} selectedId={selectedId} />
                <InboxPreview message={selected} />
            </div>
        </>
    );
}

function NotifList({
    messages,
    onSelect,
    selectedId,
}: {
    messages: Message[];
    onSelect: (id: string) => void;
    selectedId: null | string;
}) {
    if (messages.length === 0) {
        return (
            <div className="flex w-[380px] shrink-0 items-center justify-center border-r border-line p-4 font-mono text-[12px] text-dim">
                no messages yet — subscribe to a channel
            </div>
        );
    }

    const now = messages.slice(0, 2);
    const earlier = messages.slice(2);

    return (
        <div className="w-[380px] shrink-0 overflow-auto border-r border-line">
            {now.length > 0 && (
                <>
                    <SectionLabel>NOW</SectionLabel>
                    {now.map((m) => (
                        <NotifRow
                            active={m.id === selectedId}
                            key={m.id}
                            message={m}
                            onClick={() => onSelect(m.id)}
                        />
                    ))}
                </>
            )}
            {earlier.length > 0 && (
                <>
                    <SectionLabel>EARLIER</SectionLabel>
                    {earlier.map((m) => (
                        <NotifRow
                            active={m.id === selectedId}
                            key={m.id}
                            message={m}
                            onClick={() => onSelect(m.id)}
                        />
                    ))}
                </>
            )}
        </div>
    );
}

function SearchInput() {
    return (
        <div className="flex w-[300px] items-center gap-2 rounded-md border border-line bg-elev px-2.5 py-1.5">
            <Search className="text-dim" size={12} />
            <span className="flex-1 font-mono text-[11.5px] text-dim">
                search or use priority:&gt;=4 …
            </span>
            <span className="rounded border border-line px-1.5 py-px font-mono text-[9.5px] text-faint">
                ⌘K
            </span>
        </div>
    );
}

function SectionLabel({ children }: { children: string }) {
    return (
        <p className="px-4.5 py-2.5 font-mono text-[10px] tracking-[1.5px] text-dim">{children}</p>
    );
}

function SubscribeButton() {
    return (
        <button className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 font-mono text-[12px] font-semibold text-bg hover:bg-accent-dim">
            <Plus size={12} /> subscribe
        </button>
    );
}
