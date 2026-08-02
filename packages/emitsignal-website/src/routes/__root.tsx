import type { QueryClient } from '@tanstack/react-query';

import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import { SessionProvider } from '#/ctx/session';

import appCss from '../styles.css?url';

export interface RouterContext {
    queryClient: QueryClient;
}

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://emitsignal.com';
const DEFAULT_DESCRIPTION =
    'A pubsub layer for humans. Pipe anything into a topic from your shell, CI, or cron, then read it on your phone, terminal, or inbox.';
const DEFAULT_TITLE = 'EmitSignal: push notifications with one curl';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export const Route = createRootRouteWithContext<RouterContext>()({
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
