import { createFileRoute } from '@tanstack/react-router';

import { InboxLayout } from '#/components/app/inbox/inbox-layout';

export const Route = createFileRoute('/app/inbox/$messageId')({
    component: InboxMessagePage,
});

function InboxMessagePage() {
    const { messageId } = Route.useParams();
    return <InboxLayout selectedId={messageId} />;
}
