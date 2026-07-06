import Elysia from 'elysia';

import { duration } from '../../lib/duration';
import { bus, type MessageEvent } from '../../lib/event-bus';
import { getClientIP } from '../../lib/ip';
import { prisma } from '../../lib/prisma';
import { acquireSseSlot } from '../../lib/rate-limit';
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

        const topicNames = (query.topics ?? '')
            .split(',')
            .map((topic) => topic.trim())
            .filter(Boolean);

        // Only stream topics the caller may read. Unclaimed and public/readonly
        // topics stay open; private topics require membership.
        let readableTopics = topicNames;

        if (topicNames.length) {
            const topics = await prisma.topic.findMany({ where: { name: { in: topicNames } } });
            const topicsByName = new Map(topics.map((topic) => [topic.name, topic]));
            const allowedTopicNames: string[] = [];

            for (const name of topicNames) {
                const topic = topicsByName.get(name);

                // Unknown names stay subscribable (they simply never emit),
                // preserving prior behavior for not-yet-created topics.
                if (!topic || (await resolveTopicCapabilities(topic, userId)).canRead) {
                    allowedTopicNames.push(name);
                }
            }

            readableTopics = allowedTopicNames;
        }

        // Wildcard fan-out can surface private topics, so gate each message by a
        // cached readability check keyed on its topic name.
        const readableCache = new Map<string, boolean>();
        const canReadTopic = async (name: string): Promise<boolean> => {
            const cached = readableCache.get(name);

            if (cached !== undefined) {
                return cached;
            }

            const topic = await prisma.topic.findUnique({ where: { name } });
            const allowed = topic ? (await resolveTopicCapabilities(topic, userId)).canRead : true;

            readableCache.set(name, allowed);

            return allowed;
        };

        Object.assign(set.headers, sseHeaders());

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                const encoder = new TextEncoder();
                const send = (event: string, data: unknown) =>
                    controller.enqueue(encoder.encode(formatEvent(event, data)));

                const unsubscribers = topicNames.length
                    ? readableTopics.map((name) =>
                          bus.subscribe(name, (event) => send('message', event)),
                      )
                    : [
                          bus.subscribe('*', (event: MessageEvent) => {
                              void canReadTopic(event.topicName).then((allowed) => {
                                  if (allowed) {
                                      send('message', event);
                                  }
                              });
                          }),
                      ];

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
