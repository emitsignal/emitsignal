import { createFileRoute } from '@tanstack/react-router';

import { InboxLayout } from '#/components/app/inbox/inbox-layout';

export const Route = createFileRoute('/app/inbox/')({
    component: InboxIndexPage,
});

function InboxIndexPage() {
    return <InboxLayout selectedId={null} />;
}
