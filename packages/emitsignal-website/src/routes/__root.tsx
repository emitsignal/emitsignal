import { TanStackDevtools } from '@tanstack/react-devtools';
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import appCss from '../styles.css?url';

export const Route = createRootRoute({
    head: () => ({
        links: [{ href: appCss, rel: 'stylesheet' }],
        meta: [
            { charSet: 'utf-8' },
            { content: 'width=device-width, initial-scale=1', name: 'viewport' },
            { title: 'EmitSignal — push notifications with one curl' },
            {
                content:
                    'A pubsub layer for humans. Pipe anything into a topic from your shell, CI, cron, or a webhook — get it on your phone, terminal, slack, or email.',
                name: 'description',
            },
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
                {children}
                <TanStackDevtools
                    config={{ position: 'bottom-right' }}
                    plugins={[
                        {
                            name: 'Tanstack Router',
                            render: <TanStackRouterDevtoolsPanel />,
                        },
                    ]}
                />
                <Scripts />
            </body>
        </html>
    );
}
