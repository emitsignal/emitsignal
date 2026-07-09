import Elysia, { t } from 'elysia';

import { duration } from '../../lib/duration';
import { bus } from '../../lib/event-bus';
import { getClientIP } from '../../lib/ip';
import { acquireSseSlot } from '../../lib/rate-limit';
import { resolveUserId } from '../auth/plugin';

const SSE_MAX_AUTH = 10;

function sseHeaders() {
    return {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'X-Accel-Buffering': 'no',
    };
}

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

        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                const encoder = new TextEncoder();

                const unsubscribe = bus.subscribeWebhookDeliveries(userId, (delivery) => {
                    if (source && delivery.source !== source) {
                        return;
                    }

                    try {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(delivery)}\n\n`));
                    } catch {
                        // stream already closed
                    }
                });

                const cleanup = async () => {
                    clearInterval(heartbeat);
                    await slot.release();
                    unsubscribe();
                    try {
                        controller.close();
                    } catch {
                        // already closed
                    }
                };

                const heartbeat = setInterval(async () => {
                    try {
                        controller.enqueue(encoder.encode(': ping\n\n'));

                        await slot.refresh();
                    } catch {
                        await cleanup();
                    }
                }, duration.seconds(25).as('ms'));

                request.signal.addEventListener('abort', cleanup);
            },
        });

        return new Response(stream, { headers: sseHeaders() });
    },
    {
        query: t.Object({ source: t.Optional(t.String()) }),
    },
);
