import { createFileRoute, Link } from '@tanstack/react-router';

import { Toolbar } from '#/components/app/toolbar';
import { WebhookCreate } from '#/components/app/webhooks/webhook-create';

export const Route = createFileRoute('/app/webhooks/new')({ component: NewWebhookPage });

function NewWebhookPage() {
    return (
        <>
            <Toolbar
                subtitle="Configure a new inbound endpoint"
                title={
                    <span className="flex items-center gap-2">
                        <Link className="text-dim no-underline hover:text-fg" to="/app/webhooks">
                            Webhooks
                        </Link>
                        <span className="text-dim">/</span>
                        New webhook
                    </span>
                }
            />
            <WebhookCreate />
        </>
    );
}
