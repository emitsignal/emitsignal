import Elysia, { t } from 'elysia';

import { handleSseListen } from './sse-listen';

export const listen = new Elysia().get(
    '/topics/:name/listen',
    (context) => handleSseListen(context, { slotScope: 'sse', topicNames: [context.params.name] }),
    {
        query: t.Object({
            since: t.Optional(t.String()),
        }),
    },
);
