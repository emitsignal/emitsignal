import * as Sentry from '@sentry/tanstackstart-react';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import { makeQueryClient } from './lib/query-client';
import { routeTree } from './routeTree.gen';

export function getRouter() {
    const queryClient = makeQueryClient();

    const router = createTanStackRouter({
        context: { queryClient },
        defaultPreload: 'render',
        defaultPreloadStaleTime: 30000,
        routeTree,
        scrollRestoration: true,
    });

    setupRouterSsrQueryIntegration({ queryClient, router });

    if (!router.isServer && import.meta.env.VITE_SENTRY_ENABLED === 'true') {
        Sentry.addIntegration(Sentry.tanstackRouterBrowserTracingIntegration(router));
    }

    return router;
}

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
