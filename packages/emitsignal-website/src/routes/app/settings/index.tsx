import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/app/settings/')({
    beforeLoad: () => {
        throw redirect({ to: '/app/settings/profile' });
    },
    component: () => null,
});
