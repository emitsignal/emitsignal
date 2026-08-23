import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';

import { Sidebar } from '#/components/app/sidebar';
import { DebugSectionsProvider } from '#/ctx/debug-sections';
import { FeedStyleProvider } from '#/ctx/feed-style';
import { RealtimeProvider } from '#/ctx/realtime';
import { SubscriptionsProvider } from '#/ctx/subscriptions';
import { ThemeProvider, useTheme } from '#/ctx/theme';
import { ToastProvider } from '#/ctx/toast';
import { fetchBillingServer, fetchSessionServer } from '#/lib/api-server-fns';
import { isAuthenticated } from '#/lib/auth-guard';
import { readDebugSectionsFromDocument } from '#/lib/debug-sections';
import { getDebugSections } from '#/lib/debug-sections.server';
import { readFeedStyleFromDocument } from '#/lib/feed-style';
import { getFeedStyle } from '#/lib/feed-style.server';
import { queryKeys, sessionQueryOptions } from '#/lib/query-client';
import { readThemePreferenceFromDocument } from '#/lib/theme';
import { getThemePreference } from '#/lib/theme.server';

const resolveInitialTheme = createIsomorphicFn()
    .server(() => getThemePreference())
    .client(() => readThemePreferenceFromDocument());

const resolveInitialFeedStyle = createIsomorphicFn()
    .server(() => getFeedStyle())
    .client(() => readFeedStyleFromDocument());

const resolveInitialDebugSections = createIsomorphicFn()
    .server(() => getDebugSections())
    .client(() => readDebugSectionsFromDocument());

export const Route = createFileRoute('/app')({
    beforeLoad: async ({ context, preload }) => {
        if (preload) {
            return;
        }

        // On the client the session lives in the (SSR-seeded, hydrated) query
        // cache. Read it through `ensureQueryData` instead of calling
        // `authClient.getSession()` directly: the seeded value is fresh so this
        // resolves with zero network calls, and React Query dedupes the burst of
        // guard runs that route matching triggers into a single request if the
        // cache is ever cold. SSR keeps using the cheap cookie check.
        if (!import.meta.env.SSR) {
            const session = await context.queryClient.ensureQueryData(sessionQueryOptions);

            if (!session?.user) {
                throw redirect({ to: '/sign-in' });
            }

            return;
        }

        if (!(await isAuthenticated())) {
            throw redirect({ to: '/sign-in' });
        }
    },
    component: WebShell,
    loader: async ({ context }) => {
        // Seed the always-mounted sidebar footer (user + plan) server-side so it
        // renders complete on first paint instead of flashing in after mount.
        // SSR only: on client-side navigation the component queries fetch from
        // the API directly (no extra server hop). A failed fetch is swallowed so
        // the route still renders — the client queries then fetch normally.
        if (import.meta.env.SSR) {
            await Promise.allSettled([
                context.queryClient.ensureQueryData({
                    queryFn: () => fetchSessionServer(),
                    queryKey: queryKeys.session,
                    staleTime: 5 * 60_000,
                }),
                context.queryClient.ensureQueryData({
                    queryFn: () => fetchBillingServer(),
                    queryKey: queryKeys.billing,
                    staleTime: 5 * 60_000,
                }),
            ]);
        }

        return {
            debugSections: resolveInitialDebugSections(),
            feedStyle: resolveInitialFeedStyle(),
            theme: resolveInitialTheme(),
        };
    },
});

function DashboardShell() {
    const { resolvedTheme } = useTheme();

    return (
        <div
            className="flex h-screen w-full overflow-hidden bg-bg font-sans text-fg"
            data-theme={resolvedTheme}
        >
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}

function WebShell() {
    const { debugSections, feedStyle, theme } = Route.useLoaderData();

    return (
        <ThemeProvider initialTheme={theme}>
            <FeedStyleProvider initialFeedStyle={feedStyle}>
                <DebugSectionsProvider initialSections={debugSections}>
                    <SubscriptionsProvider>
                        <ToastProvider>
                            <RealtimeProvider>
                                <DashboardShell />
                            </RealtimeProvider>
                        </ToastProvider>
                    </SubscriptionsProvider>
                </DebugSectionsProvider>
            </FeedStyleProvider>
        </ThemeProvider>
    );
}
