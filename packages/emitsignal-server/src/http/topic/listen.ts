import Elysia, { t } from 'elysia';

import { getClientIP } from '../../http/plugins/rate-limit-plugin';
import { bus, type MessageEvent } from '../../lib/event-bus';
import { prisma } from '../../lib/prisma';
import { rateLimitRedis } from '../../lib/rate-limit';
import { serializeMessage } from '../../lib/topic';
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

export const listen = new Elysia().get(
    '/topics/:name/listen',
    async ({ headers, params, query, request, server, set }) => {
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

        const topic = await prisma.topic.findUnique({
            where: { name: params.name },
        });

        if (!topic) {
            if (trackedInRedis) rateLimitRedis.decr(sseKey);
            set.status = 404;
            return { error: 'topic_not_found' };
        }

        const since = query.since ? Number(query.since) : null;

        Object.assign(set.headers, sseHeaders());

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                const encoder = new TextEncoder();
                const send = (event: string, data: unknown) =>
                    controller.enqueue(encoder.encode(formatEvent(event, data)));

                if (since !== null && Number.isFinite(since)) {
                    const backlog = await prisma.message.findMany({
                        orderBy: { createdAt: 'asc' },
                        take: 200,
                        where: {
                            createdAt: { gt: new Date(since) },
                            topicId: topic.id,
                        },
                    });
                    for (const message of backlog) {
                        send('message', {
                            ...(await serializeMessage(message)),
                            topicName: topic.name,
                        });
                    }
                }

                const unsubscribe = bus.subscribe(topic.name, (e: MessageEvent) =>
                    send('message', e),
                );

                const heartbeat = setInterval(() => {
                    try {
                        controller.enqueue(encoder.encode(': ping\n\n'));
                    } catch {
                        clearInterval(heartbeat);
                    }
                }, 25_000);

                request.signal.addEventListener('abort', () => {
                    if (trackedInRedis && Bun.env.NODE_ENV !== 'test') rateLimitRedis.decr(sseKey);
                    unsubscribe();
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
    {
        query: t.Object({
            since: t.Optional(t.String()),
        }),
    },
);
