import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';

import { handleSseListen } from './sse-listen';

export const listen = new Elysia()
    .use(authPlugin)
    .get(
        '/topics/:name/listen',
        (context) =>
            handleSseListen(context, { slotScope: 'sse', topicNames: [context.params.name] }),
        {
            authOptional: true,
            query: t.Object({
                since: t.Optional(t.String()),
            }),
        },
    );
