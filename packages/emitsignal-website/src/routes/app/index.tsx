import { createFileRoute } from '@tanstack/react-router';
import { Plus, Search } from 'lucide-react';

import { NotifRow } from '#/components/app/inbox/notif-row';
import { InboxPreview } from '#/components/app/inbox/preview';
import { Toolbar } from '#/components/app/toolbar';
import { SAMPLE_NOTIFS } from '#/lib/data';

export const Route = createFileRoute('/app/')({ component: InboxPage });

function InboxPage() {
    return (
        <>
            <Toolbar
                actions={
                    <>
                        <SearchInput />
                        <SubscribeButton />
                    </>
                }
                subtitle="7 unread · 3 channels active"
                title="Inbox"
            />

            <div className="flex min-h-0 flex-1">
                <NotifList />
                <InboxPreview />
            </div>
        </>
    );
}

function NotifList() {
    return (
        <div className="w-[380px] shrink-0 overflow-auto border-r border-line">
            <SectionLabel>NOW</SectionLabel>
            {SAMPLE_NOTIFS.slice(0, 2).map((n, i) => (
                <NotifRow active={i === 1} key={n.id} notif={n} />
            ))}
            <SectionLabel>EARLIER</SectionLabel>
            {SAMPLE_NOTIFS.slice(2).map((n) => (
                <NotifRow key={n.id} notif={n} />
            ))}
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
