import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';

import { Sidebar } from '#/components/app/sidebar';
import { SubscriptionsProvider } from '#/ctx/subscriptions';
import { hasAuthCookie } from '#/lib/auth.server';
import { getSession } from '#/lib/storage';

const isAuthenticated = createIsomorphicFn()
    .server(() => hasAuthCookie())
    .client(() => !!getSession());

export const Route = createFileRoute('/app')({
    beforeLoad: async () => {
        if (!(await isAuthenticated())) {
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
