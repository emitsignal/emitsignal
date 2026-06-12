import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import { makeQueryClient } from './lib/query-client';
import { routeTree } from './routeTree.gen';

export function getRouter() {
    const queryClient = makeQueryClient();

    const router = createTanStackRouter({
        defaultPreload: 'render',
        defaultPreloadStaleTime: 30000,
        routeTree,
        scrollRestoration: true,
    });

    setupRouterSsrQueryIntegration({ queryClient, router });

    return router;
}

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
