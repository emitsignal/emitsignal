import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';

import { Sidebar } from '#/components/app/sidebar';
import { SubscriptionsProvider } from '#/ctx/subscriptions';
import { ThemeProvider, useTheme } from '#/ctx/theme';
import { authClient } from '#/lib/auth-client';
import { hasAuthCookie } from '#/lib/auth.server';
import { readThemePreferenceFromDocument } from '#/lib/theme';
import { getThemePreference } from '#/lib/theme.server';

const isAuthenticated = createIsomorphicFn()
    .server(() => hasAuthCookie())
    .client(async () => {
        const cached = authClient.$store.atoms['session'].get();

        if (cached.data?.user) {
            return true;
        }

        const { data } = await authClient.getSession();

        return !!data?.user;
    });

const resolveInitialTheme = createIsomorphicFn()
    .server(() => getThemePreference())
    .client(() => readThemePreferenceFromDocument());

export const Route = createFileRoute('/app')({
    beforeLoad: async () => {
        if (!(await isAuthenticated())) {
            throw redirect({ to: '/sign-in' });
        }
    },
    component: WebShell,
    loader: () => ({ theme: resolveInitialTheme() }),
});

function DashboardShell() {
    const { theme } = useTheme();

    return (
        <div
            className="flex h-screen w-full overflow-hidden bg-bg font-sans text-fg"
            data-theme={theme}
        >
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}

function WebShell() {
    const { theme } = Route.useLoaderData();

    return (
        <ThemeProvider initialTheme={theme}>
            <SubscriptionsProvider>
                <DashboardShell />
            </SubscriptionsProvider>
        </ThemeProvider>
    );
}
