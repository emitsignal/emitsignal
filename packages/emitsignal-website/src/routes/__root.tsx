import type { QueryClient } from '@tanstack/react-query';

import * as Sentry from '@sentry/tanstackstart-react';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, HeadContent, Link, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { useEffect } from 'react';

import { SessionProvider } from '#/ctx/session';
import { buildSeoMeta, jsonLdScript, ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from '#/lib/seo';

import appCss from '../styles.css?url';

if (import.meta.env.SSR) {
    import('#/lib/instrument-server');
}

export interface RouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
    errorComponent: ({ error }) => <RootErrorFallback error={error} />,
    head: () => {
        // Defaults only. Every leaf route calls `buildSeoMeta` itself, which overrides
        // these by name/property and owns the single canonical link for the page.
        const seo = buildSeoMeta({ path: '/' });

        return {
            links: [
                { href: appCss, rel: 'stylesheet' },
                { href: '/manifest.json', rel: 'manifest' },
                { href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' },
                { href: '/favicon.ico', rel: 'alternate icon', sizes: 'any' },
                { href: '/apple-touch-icon.png', rel: 'apple-touch-icon' },
            ],
            meta: [
                { charSet: 'utf-8' },
                // The public site is dark-only; only the /app subtree switches themes.
                { content: '#000000', name: 'theme-color' },
                { content: '1200', property: 'og:image:width' },
                { content: '630', property: 'og:image:height' },
                { content: 'width=device-width, initial-scale=1', name: 'viewport' },
                ...seo.meta,
            ],
            scripts: [jsonLdScript(ORGANIZATION_SCHEMA), jsonLdScript(WEBSITE_SCHEMA)],
        };
    },
    notFoundComponent: () => <RootNotFound />,
    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                <SessionProvider>{children}</SessionProvider>

                {import.meta.env.DEV && (
                    <TanStackDevtools
                        config={{ position: 'bottom-right' }}
                        plugins={[
                            {
                                name: 'Tanstack Router',
                                render: <TanStackRouterDevtoolsPanel />,
                            },
                            {
                                name: 'Tanstack Query',
                                render: <ReactQueryDevtoolsPanel />,
                            },
                        ]}
                    />
                )}
                <Scripts />
            </body>
        </html>
    );
}

function RootErrorFallback({ error }: { error: Error }) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Something went wrong.</p>
        </div>
    );
}

function RootNotFound() {
    return (
        <div className="flex min-h-full w-full flex-col items-center justify-center gap-4 bg-bg px-5 py-24 text-center font-sans text-fg">
            <p className="m-0 font-mono text-[11px] uppercase tracking-[1.6px] text-accent">404</p>

            <h1 className="m-0 text-[40px] font-semibold leading-[1.1] tracking-[-1.2px]">
                Page not found
            </h1>

            <p className="m-0 max-w-[420px] text-[15px] leading-[1.6] text-muted">
                That page does not exist, or it moved somewhere else.
            </p>

            <Link className="text-[14px] text-accent no-underline hover:underline" to="/">
                Back to home
            </Link>
        </div>
    );
}
