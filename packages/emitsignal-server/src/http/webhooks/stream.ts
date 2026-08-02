import Elysia, { t } from 'elysia';

import { bus } from '../../lib/event-bus';
import { getClientIP } from '../../lib/ip';
import { acquireSseSlot } from '../../lib/rate-limit';
import { createSseStream, sseHeaders } from '../../lib/sse';
import { resolveUserId } from '../auth/plugin';

const SSE_MAX_AUTH = 10;

export const streamWebhookDeliveries = new Elysia().get(
    '/webhooks/stream',
    async ({ headers, query, request, server, set, status }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return status(401, { error: 'missing_token' });
        }

        const ip = getClientIP(request, server);
        const sseKey = `rl:sse:webhooks:${userId ?? ip}`;
        const slot = await acquireSseSlot(sseKey, SSE_MAX_AUTH);

        if (!slot) {
            set.headers['retry-after'] = '60';
            set.status = 429;

            return { error: 'too_many_sse_connections', max: SSE_MAX_AUTH, retryAfter: 60 };
        }

        const source = query.source?.trim() || undefined;

        Object.assign(set.headers, sseHeaders());

        const stream = createSseStream({
            onStart: (send) =>
                bus.subscribeWebhookDeliveries(userId, (delivery) => {
                    if (source && delivery.source !== source) {
                        return;
                    }

                    // Bare `data:` frame — the CLI reader ignores event names.
                    send(null, delivery);
                }),
            request,
            slot,
        });

        return new Response(stream, { headers: sseHeaders() });
    },
    {
        query: t.Object({ source: t.Optional(t.String()) }),
    },
);
