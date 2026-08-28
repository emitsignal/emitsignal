import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { bus } from '#/lib/event-bus';
import { acquireSseSlot } from '#/lib/rate-limit';
import { createSseStream, sseHeaders } from '#/lib/sse';
import { getClientIP } from '#/utils/ip';

const SSE_MAX_AUTH = 10;

export const streamWebhookDeliveries = new Elysia().use(authPlugin).get(
    '/webhooks/stream',
    async ({ query, request, server, set, userId }) => {
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
        authRequired: true,
        query: t.Object({ source: t.Optional(t.String()) }),
    },
);
