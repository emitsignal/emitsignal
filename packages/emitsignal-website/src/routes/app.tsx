import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { Sidebar } from '#/components/app/sidebar';
import { SubscriptionsProvider } from '#/ctx/subscriptions';
import { getSession } from '#/lib/storage';

export const Route = createFileRoute('/app')({
    beforeLoad: async () => {
        if (typeof window === 'undefined') {
            const { getCookie } = await import('@tanstack/react-start/server');

            if (!getCookie('emitsignal_auth')) {
                throw redirect({ to: '/sign-in' });
            }

            return;
        }

        const session = getSession();

        if (!session) {
            throw redirect({ to: '/sign-in' });
        }
    },
    component: WebShell,
});

function WebShell() {
    return (
        <SubscriptionsProvider>
            <div className="flex h-screen w-full overflow-hidden bg-bg font-sans text-fg">
                <Sidebar />
                <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <Outlet />
                </main>
            </div>
        </SubscriptionsProvider>
    );
}
