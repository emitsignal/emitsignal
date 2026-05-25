import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import { KeysTable } from '#/components/app/keys/keys-table';
import { Toolbar } from '#/components/app/toolbar';
import { SubHeading } from '#/components/ui/sub-head';

export const Route = createFileRoute('/app/keys')({ component: KeysPage });

function KeysPage() {
    return (
        <>
            <Toolbar
                actions={
                    <button className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-[12px] font-semibold text-bg hover:bg-accent-dim">
                        <Plus size={12} /> New key
                    </button>
                }
                subtitle="5 keys"
                title="API Keys & Integrations"
            />

            <div className="flex-1 overflow-auto px-5.5 py-5">
                <SubHeading>KEYS</SubHeading>
                <KeysTable />
            </div>
        </>
    );
}
