import Elysia from 'elysia';

import { duration } from '../../lib/duration';
import { bus } from '../../lib/event-bus';
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

async function resolveOwnTopicNames(userId: string): Promise<string[]> {
    const [owned, subscribed] = await Promise.all([
        prisma.topic.findMany({ select: { name: true }, where: { ownerId: userId } }),
        prisma.subscription.findMany({
            select: { topic: { select: { name: true } } },
            where: { userId },
        }),
    ]);

    return [
        ...new Set([
            ...owned.map((topic) => topic.name),
            ...subscribed.map((subscription) => subscription.topic.name),
        ]),
    ];
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

        if (topicNames.length === 0 && !userId) {
            await slot.release();

            set.status = 400;

            return {
                error: 'topics_required',
                message: 'anonymous listeners must specify ?topics=',
            };
        }

        const requestedTopicNames = topicNames.length
            ? topicNames
            : await resolveOwnTopicNames(userId as string);

        const topics = await prisma.topic.findMany({
            where: { name: { in: requestedTopicNames } },
        });

        const readableTopics: string[] = [];
        const topicsByName = new Map(topics.map((topic) => [topic.name, topic]));

        for (const topicName of requestedTopicNames) {
            const topic = topicsByName.get(topicName);

            if (!topic || (await resolveTopicCapabilities(topic, userId)).canRead) {
                readableTopics.push(topicName);
            }
        }

        Object.assign(set.headers, sseHeaders());

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                const encoder = new TextEncoder();
                const send = (event: string, data: unknown) =>
                    controller.enqueue(encoder.encode(formatEvent(event, data)));

                const unsubscribers = readableTopics.map((name) =>
                    bus.subscribe(name, (event) => send('message', event)),
                );

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
);
