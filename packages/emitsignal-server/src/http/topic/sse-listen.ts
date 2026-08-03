// Single implementation behind both listen endpoints:
//   GET /topics/:name/listen  → one explicitly named topic
//   GET /listen?topics=a,b    → several named topics, or the caller's own topics
//
// The only difference between them is where the topic names come from and which
// concurrency budget the connection draws on.

import type { MessageEvent } from '#/lib/event-bus';
import type { ServerLike } from '#/lib/ip';

import { resolveUserId } from '#/http/auth/plugin';
import { bus } from '#/lib/event-bus';
import { getClientIP } from '#/lib/ip';
import { prisma } from '#/lib/prisma';
import { acquireSseSlot } from '#/lib/rate-limit';
import { createSseStream, sseHeaders } from '#/lib/sse';
import { serializeMessage } from '#/lib/topic';
import { resolveTopicCapabilities } from '#/lib/topic-access';

const BACKLOG_LIMIT = 200;
const SSE_MAX_ANON = 3;
const SSE_MAX_AUTH = 10;

interface SseListenContext {
    headers: Record<string, string | undefined>;
    query: { since?: string; topics?: string };
    request: Request;
    server: ServerLike;
    set: { headers: Record<string, number | string>; status?: number | string };
}

interface SseListenOptions {
    slotScope: 'sse:multi' | 'sse';
    topicNames: null | string[];
}

export async function handleSseListen(
    { headers, query, request, server, set }: SseListenContext,
    options: SseListenOptions,
) {
    const ip = getClientIP(request, server);
    const userId = await resolveUserId({ headers });
    const sseKey = `rl:${options.slotScope}:${userId ?? ip}`;
    const max = userId ? SSE_MAX_AUTH : SSE_MAX_ANON;

    const slot = await acquireSseSlot(sseKey, max);

    if (!slot) {
        set.headers['retry-after'] = '60';
        set.status = 429;

        return { error: 'too_many_sse_connections', max, retryAfter: 60 };
    }

    const explicitTopicNames =
        options.topicNames ??
        (query.topics ?? '')
            .split(',')
            .map((topic) => topic.trim())
            .filter(Boolean);

    if (explicitTopicNames.length === 0 && !userId) {
        await slot.release();

        set.status = 400;

        return {
            error: 'topics_required',
            message: 'anonymous listeners must specify ?topics=',
        };
    }

    const requestedTopicNames = explicitTopicNames.length
        ? explicitTopicNames
        : await resolveOwnTopicNames(userId as string);

    const topics = await prisma.topic.findMany({
        where: { name: { in: requestedTopicNames } },
    });

    const topicsByName = new Map(topics.map((topic) => [topic.name, topic]));
    const readableTopicNames: string[] = [];

    for (const topicName of requestedTopicNames) {
        const topic = topicsByName.get(topicName);

        // A topic that doesn't exist yet is still listenable: publishing creates
        // it on first use, so listeners are allowed to connect ahead of that.
        if (!topic || (await resolveTopicCapabilities(topic, userId)).canRead) {
            readableTopicNames.push(topicName);
        }
    }

    if (explicitTopicNames.length > 0 && readableTopicNames.length === 0) {
        await slot.release();

        set.status = 404;

        return { error: 'topic_not_found' };
    }

    const since = query.since ? Number(query.since) : null;
    const shouldReplay = since !== null && Number.isFinite(since);

    const readableTopics = readableTopicNames
        .map((topicName) => topicsByName.get(topicName))
        .filter((topic) => topic !== undefined);

    Object.assign(set.headers, sseHeaders());

    const stream = createSseStream({
        onStart: async (send) => {
            if (shouldReplay && readableTopics.length > 0) {
                const topicNameById = new Map(
                    readableTopics.map((topic) => [topic.id, topic.name]),
                );

                const backlog = await prisma.message.findMany({
                    orderBy: { createdAt: 'asc' },
                    take: BACKLOG_LIMIT,
                    where: {
                        createdAt: { gt: new Date(since) },
                        topicId: { in: [...topicNameById.keys()] },
                    },
                });

                for (const message of backlog) {
                    send('message', {
                        ...(await serializeMessage(message, 0, true)),
                        topicName: topicNameById.get(message.topicId) ?? '',
                    });
                }
            }

            const unsubscribers = readableTopicNames.map((topicName) =>
                bus.subscribe(topicName, (event: MessageEvent) => send('message', event)),
            );

            return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
        },
        request,
        slot,
    });

    return new Response(stream, { headers: sseHeaders() });
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
