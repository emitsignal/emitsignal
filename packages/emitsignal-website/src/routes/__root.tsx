import type { QueryClient } from '@tanstack/react-query';

import * as Sentry from '@sentry/tanstackstart-react';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, HeadContent, Link, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { useEffect } from 'react';

import { SessionProvider } from '#/ctx/session';

import appCss from '../styles.css?url';

if (import.meta.env.SSR) {
    import('#/lib/instrument-server');
}

export interface RouterContext {
    queryClient: QueryClient;
}

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://emitsignal.com';
const DEFAULT_DESCRIPTION =
    'A pubsub layer for humans. Pipe anything into a topic from your shell, CI, or cron, then read it on your phone, terminal, or inbox.';
const DEFAULT_TITLE = 'EmitSignal: push notifications with one curl';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export const Route = createRootRouteWithContext<RouterContext>()({
    errorComponent: ({ error }) => <RootErrorFallback error={error} />,
    head: () => ({
        links: [{ href: appCss, rel: 'stylesheet' }],
        meta: [
            { charSet: 'utf-8' },
            { content: '1200', property: 'og:image:width' },
            { content: '630', property: 'og:image:height' },
            { content: 'summary_large_image', name: 'twitter:card' },
            { content: 'website', property: 'og:type' },
            { content: 'width=device-width, initial-scale=1', name: 'viewport' },
            { content: DEFAULT_DESCRIPTION, name: 'description' },
            { content: DEFAULT_DESCRIPTION, name: 'twitter:description' },
            { content: DEFAULT_DESCRIPTION, property: 'og:description' },
            { content: DEFAULT_OG_IMAGE, name: 'twitter:image' },
            { content: DEFAULT_OG_IMAGE, property: 'og:image' },
            { content: DEFAULT_TITLE, name: 'twitter:title' },
            { content: DEFAULT_TITLE, property: 'og:title' },
            { content: SITE_URL, property: 'og:url' },
            { title: DEFAULT_TITLE },
        ],
    }),
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
