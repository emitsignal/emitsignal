import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router';
import { Filter } from 'lucide-react';

import { Toolbar } from '#/components/app/toolbar';
import { DeliveriesLog } from '#/components/app/webhooks/deliveries-log';

export const Route = createFileRoute('/app/webhooks/$webhookId')({
    component: WebhookDeliveriesPage,
});

function WebhookDeliveriesPage() {
    const { webhookId } = Route.useParams();
    const isEditActive = useRouterState({
        select: (s) => s.matches.some((m) => m.routeId === '/app/webhooks/$webhookId/edit'),
    });

    // When the edit child route is active, let <Outlet> render it instead
    if (isEditActive) {
        return <Outlet />;
    }

    return (
        <>
            <Toolbar
                actions={
                    <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-1.5 font-mono text-[11px] text-success">
                            <span
                                className="inline-block h-1.5 w-1.5 rounded-full bg-success"
                                style={{ boxShadow: '0 0 7px #4ade8099' }}
                            />
                            live
                        </span>
                        <button className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-[12px] text-muted hover:bg-elev hover:text-fg">
                            <Filter size={12} /> all sources
                        </button>
                    </div>
                }
                title={
                    <span className="flex items-center gap-2">
                        <Link className="text-dim no-underline hover:text-fg" to="/app/webhooks">
                            Webhooks
                        </Link>
                        <span className="text-dim">/</span>
                        Deliveries
                    </span>
                }
            />
            <DeliveriesLog webhookId={webhookId} />
        </>
    );
}
