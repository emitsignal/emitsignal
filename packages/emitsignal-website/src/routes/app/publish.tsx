import { createFileRoute } from '@tanstack/react-router';
import { Zap } from 'lucide-react';

import { ComposeForm } from '#/components/app/publish/compose-form';
import { PreviewColumn } from '#/components/app/publish/preview-column';
import { Toolbar } from '#/components/app/toolbar';

export const Route = createFileRoute('/app/publish')({ component: ComposePage });

function ComposePage() {
    return (
        <>
            <Toolbar
                actions={
                    <div className="flex gap-2">
                        <button className="rounded-md border border-line px-2.5 py-1 font-mono text-[12px] text-muted hover:bg-elev">
                            save as template
                        </button>
                        <button className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-[12px] font-semibold text-bg hover:bg-accent-dim">
                            <Zap size={12} /> Send signal
                        </button>
                    </div>
                }
                subtitle="POST emitsignal.sh/:topic"
                title="Publish a message"
            />

            <div className="flex min-h-0 flex-1">
                <ComposeForm />
                <PreviewColumn />
            </div>
        </>
    );
}
