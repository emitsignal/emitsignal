import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';

import { Sidebar } from '#/components/app/sidebar';
import { DebugSectionsProvider } from '#/ctx/debug-sections';
import { FeedStyleProvider } from '#/ctx/feed-style';
import { SubscriptionsProvider } from '#/ctx/subscriptions';
import { ThemeProvider, useTheme } from '#/ctx/theme';
import { isAuthenticated } from '#/lib/auth-guard';
import { readDebugSectionsFromDocument } from '#/lib/debug-sections';
import { getDebugSections } from '#/lib/debug-sections.server';
import { readFeedStyleFromDocument } from '#/lib/feed-style';
import { getFeedStyle } from '#/lib/feed-style.server';
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
    beforeLoad: async ({ preload }) => {
        if (preload) {
            return;
        }

        if (!(await isAuthenticated())) {
            throw redirect({ to: '/sign-in' });
        }
    },
    component: WebShell,
    loader: () => ({
        debugSections: resolveInitialDebugSections(),
        feedStyle: resolveInitialFeedStyle(),
        theme: resolveInitialTheme(),
    }),
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
    const { debugSections, feedStyle, theme } = Route.useLoaderData();

    return (
        <ThemeProvider initialTheme={theme}>
            <FeedStyleProvider initialFeedStyle={feedStyle}>
                <DebugSectionsProvider initialSections={debugSections}>
                    <SubscriptionsProvider>
                        <DashboardShell />
                    </SubscriptionsProvider>
                </DebugSectionsProvider>
            </FeedStyleProvider>
        </ThemeProvider>
    );
}
