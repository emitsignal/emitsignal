import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import { Toolbar } from '#/components/app/toolbar';
import { WebhooksTable } from '#/components/app/webhooks/webhooks-table';
import { useWebhooks } from '#/hooks/use-webhooks';

export const Route = createFileRoute('/app/webhooks/')({ component: WebhooksPage });

function WebhooksPage() {
    const { loading, remove, update, webhooks } = useWebhooks();

    return (
        <>
            <Toolbar
                actions={
                    <Link
                        className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-[12px] font-semibold text-bg no-underline hover:bg-accent-dim"
                        to="/app/webhooks/new"
                    >
                        <Plus size={12} /> New webhook
                    </Link>
                }
                subtitle={`${webhooks.length} endpoints`}
                title="Webhooks"
            />

            <div className="flex-1 overflow-auto px-5.5 py-5">
                <p className="mb-5 max-w-xl text-[13.5px] leading-relaxed text-muted">
                    Inbound endpoints. Point any service at a webhook URL — with a{' '}
                    <span className="text-accent">template</span> it&apos;s pretty-printed into a
                    notification, without one the raw payload is forwarded as-is.
                </p>

                <WebhooksTable
                    loading={loading}
                    remove={remove}
                    update={update}
                    webhooks={webhooks}
                />
            </div>
        </>
    );
}
