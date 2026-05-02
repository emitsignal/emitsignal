import Elysia, { t } from "elysia";

import { bus, type MessageEvent } from "../../lib/event-bus";
import { prisma } from "../../lib/prisma";
import { serializeMessage } from "../../lib/topic";

function formatEvent(event: string, data: unknown) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sseHeaders() {
    return {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
        "X-Accel-Buffering": "no",
    };
}

export const listen = new Elysia().get(
    "/topics/:name/listen",
    async ({ params, query, request, set }) => {
        const topic = await prisma.topic.findUnique({
            where: { name: params.name },
        });
        if (!topic) {
            set.status = 404;
            return { error: "topic_not_found" };
        }

        const since = query.since ? Number(query.since) : null;

        Object.assign(set.headers, sseHeaders());

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                const encoder = new TextEncoder();
                const send = (event: string, data: unknown) =>
                    controller.enqueue(encoder.encode(formatEvent(event, data)));

                send("hello", {
                    connectedAt: Date.now(),
                    topic: topic.name,
                });

                if (since !== null && Number.isFinite(since)) {
                    const backlog = await prisma.message.findMany({
                        orderBy: { createdAt: "asc" },
                        take: 200,
                        where: {
                            createdAt: { gt: new Date(since) },
                            topicId: topic.id,
                        },
                    });
                    for (const message of backlog) {
                        send("message", {
                            ...serializeMessage(message),
                            topicName: topic.name,
                        });
                    }
                }

                const unsubscribe = bus.subscribe(topic.name, (e: MessageEvent) =>
                    send("message", e),
                );

                const heartbeat = setInterval(() => {
                    try {
                        controller.enqueue(encoder.encode(": ping\n\n"));
                    } catch {
                        clearInterval(heartbeat);
                    }
                }, 25_000);

                request.signal.addEventListener("abort", () => {
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
