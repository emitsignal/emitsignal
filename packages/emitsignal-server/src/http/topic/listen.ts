import Elysia, { t } from 'elysia';

import { duration } from '../../lib/duration';
import { bus, type MessageEvent } from '../../lib/event-bus';
import { getClientIP } from '../../lib/ip';
import { prisma } from '../../lib/prisma';
import { acquireSseSlot } from '../../lib/rate-limit';
import { serializeMessage } from '../../lib/topic';
import { resolveTopicCapabilities } from '../../lib/topic-access';
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

        const slot = await acquireSseSlot(sseKey, max);

        if (!slot) {
            set.headers['retry-after'] = '60';
            set.status = 429;

            return { error: 'too_many_sse_connections', max, retryAfter: 60 };
        }

        const topic = await prisma.topic.findUnique({
            where: { name: params.name },
        });

        if (!topic) {
            slot.release();
            set.status = 404;

            return { error: 'topic_not_found' };
        }

        const capabilities = await resolveTopicCapabilities(topic, userId);

        if (!capabilities.canRead) {
            slot.release();
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

                const unsubscribe = bus.subscribe(topic.name, (messageEvent: MessageEvent) =>
                    send('message', messageEvent),
                );

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
        query: t.Object({
            since: t.Optional(t.String()),
        }),
    },
);
