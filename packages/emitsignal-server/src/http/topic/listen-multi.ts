import Elysia from 'elysia';

import { getClientIP } from '../../http/plugins/rate-limit-plugin';
import { bus } from '../../lib/event-bus';
import { rateLimitRedis } from '../../lib/rate-limit';
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
        const sseKey = `rl:sse:${userId ?? ip}`;
        const max = userId ? SSE_MAX_AUTH : SSE_MAX_ANON;

        let trackedInRedis = false;

        if (Bun.env.NODE_ENV !== 'test') {
            try {
                const current = await rateLimitRedis.incr(sseKey);
                await rateLimitRedis.expire(sseKey, 86400);

                trackedInRedis = true;

                if (current > max) {
                    await rateLimitRedis.decr(sseKey);

                    trackedInRedis = false;
                    set.status = 429;
                    set.headers['retry-after'] = '60';

                    return { error: 'too_many_sse_connections', max, retryAfter: 60 };
                }
            } catch {
                // Redis unavailable — fail open, connection not tracked
            }
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

                const heartbeat = setInterval(() => {
                    try {
                        controller.enqueue(encoder.encode(': ping\n\n'));
                    } catch {
                        clearInterval(heartbeat);
                    }
                }, 25_000);

                request.signal.addEventListener('abort', () => {
                    if (trackedInRedis && Bun.env.NODE_ENV !== 'test') {
                        rateLimitRedis.decr(sseKey);
                    }

                    unsubscribers.forEach((off) => off());

                    clearInterval(heartbeat);

                    try {
                        controller.close();
                    } catch {
                        // already closed
                    }
                });
            },
        });

        return new Response(stream, { headers: sseHeaders() });
    },
);
