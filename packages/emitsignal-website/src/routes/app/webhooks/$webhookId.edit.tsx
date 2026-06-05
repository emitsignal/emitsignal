import { createFileRoute, Link } from '@tanstack/react-router';

import { Toolbar } from '#/components/app/toolbar';
import { WebhookCreate } from '#/components/app/webhooks/webhook-create';
import { useWebhook } from '#/hooks/use-webhook';

export const Route = createFileRoute('/app/webhooks/$webhookId/edit')({
    component: EditWebhookPage,
});

function EditWebhookPage() {
    const { webhookId } = Route.useParams();
    const { loading, webhook } = useWebhook(webhookId);

    return (
        <>
            <Toolbar
                subtitle="Update template, channel, or status"
                title={
                    <span className="flex items-center gap-2">
                        <Link className="text-dim no-underline hover:text-fg" to="/app/webhooks">
                            Webhooks
                        </Link>
                        <span className="text-dim">/</span>
                        {webhook ? webhook.name : 'Edit'}
                        <span className="text-dim">/</span>
                        Edit
                    </span>
                }
            />
            {loading ? (
                <div className="flex flex-1 items-center justify-center font-mono text-[12px] text-dim">
                    loading…
                </div>
            ) : webhook ? (
                <WebhookCreate
                    initialData={{
                        id: webhook.id,
                        name: webhook.name,
                        slug: webhook.slug,
                        source: webhook.source,
                        template: webhook.template ?? null,
                        topicName: webhook.topicName,
                    }}
                />
            ) : (
                <div className="flex flex-1 items-center justify-center font-mono text-[12px] text-danger">
                    Webhook not found
                </div>
            )}
        </>
    );
}
