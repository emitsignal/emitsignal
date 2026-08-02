import Elysia, { t } from 'elysia';

import { handleSseListen } from './sse-listen';

export const listenMulti = new Elysia().get(
    '/listen',
    (context) => handleSseListen(context, { slotScope: 'sse:multi', topicNames: null }),
    {
        query: t.Object({
            since: t.Optional(t.String()),
            topics: t.Optional(t.String()),
        }),
    },
);
