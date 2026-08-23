import { createFileRoute, Link } from '@tanstack/react-router';

import { Toolbar } from '#/components/app/toolbar';
import { WebhookCreate } from '#/components/app/webhooks/webhook-create';
import { SkeletonTableRows } from '#/components/ui/skeleton';
import { useWebhook } from '#/hooks/use-webhook';
import { useWebhookDeliveries } from '#/hooks/use-webhook-deliveries';

export const Route = createFileRoute('/app/webhooks/$webhookId/edit')({
    component: EditWebhookPage,
});

function EditWebhookPage() {
    const { webhookId } = Route.useParams();
    const { loading, webhook } = useWebhook(webhookId);
    const { deliveries } = useWebhookDeliveries(webhookId, webhook?.topicName);

    const latestPayload = deliveries[0]?.payload;
    const samplePayload = latestPayload ? JSON.stringify(latestPayload, null, 2) : null;

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
                <div className="flex-1 px-5.5 py-5">
                    <SkeletonTableRows columns={[22, 40]} rows={5} />
                </div>
            ) : webhook ? (
                <WebhookCreate
                    initialData={{
                        hasSecret: webhook.hasSecret,
                        id: webhook.id,
                        name: webhook.name,
                        samplePayload,
                        slug: webhook.slug,
                        source: webhook.source,
                        template: webhook.template ?? null,
                        topicName: webhook.topicName,
                        verification: webhook.verification,
                        verificationConfig: webhook.verificationConfig,
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
