import Elysia from 'elysia';

import { duration } from '../../lib/duration';
import { bus } from '../../lib/event-bus';
import { getClientIP } from '../../lib/ip';
import { acquireSseSlot } from '../../lib/rate-limit';
import { resolveUserId } from '../auth/plugin';

const SSE_MAX_ANON = 3;
const SSE_MAX_AUTH = 10;

function formatEvent(event: string, data: unknown) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sseHeaders() {
    return {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'X-Accel-Buffering': 'no',
    };
}

export const listenMulti = new Elysia().get(
    '/listen',
    async ({ headers, query, request, server, set }) => {
        const ip = getClientIP(request, server);
        const userId = await resolveUserId({ headers });
        const sseKey = `rl:sse:multi:${userId ?? ip}`;
        const max = userId ? SSE_MAX_AUTH : SSE_MAX_ANON;

        const slot = await acquireSseSlot(sseKey, max);

        if (!slot) {
            set.headers['retry-after'] = '60';
            set.status = 429;

            return { error: 'too_many_sse_connections', max, retryAfter: 60 };
        }

        const topics = (query.topics ?? '')
            .split(',')
            .map((subscription) => subscription.trim())
            .filter(Boolean);

        Object.assign(set.headers, sseHeaders());

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                const encoder = new TextEncoder();
                const send = (event: string, data: unknown) =>
                    controller.enqueue(encoder.encode(formatEvent(event, data)));

                const unsubscribers = topics.length
                    ? topics.map((name) => bus.subscribe(name, (e) => send('message', e)))
                    : [bus.subscribe('*', (e) => send('message', e))];

                const cleanup = async () => {
                    clearInterval(heartbeat);
                    await slot.release();
                    unsubscribers.forEach((off) => off());
                    try {
                        controller.close();
                    } catch {
                        // already closed
                    }
                };

                const heartbeat = setInterval(async () => {
                    try {
                        controller.enqueue(encoder.encode(': ping\n\n'));
                    } catch {
                        await cleanup();
                    }
                }, duration.seconds(25).as('ms'));

                request.signal.addEventListener('abort', cleanup);
            },
        });

        return new Response(stream, { headers: sseHeaders() });
    },
);
