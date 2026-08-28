import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';

import { handleSseListen } from './sse-listen';

export const listenMulti = new Elysia()
    .use(authPlugin)
    .get(
        '/listen',
        (context) => handleSseListen(context, { slotScope: 'sse:multi', topicNames: null }),
        {
            authOptional: true,
            query: t.Object({
                since: t.Optional(t.String()),
                topics: t.Optional(t.String()),
            }),
        },
    );
