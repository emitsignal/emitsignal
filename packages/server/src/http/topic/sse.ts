import Elysia, { t } from "elysia";

import { bus, type MessageEvent } from "../../lib/event-bus";
import { prisma } from "../../lib/prisma";
import { serializeMessage } from "../../lib/topic";

// SSE: GET /topics/:name/listen → text/event-stream
//   Optional ?since=<unix-ms> backfills all messages newer than that timestamp,
//   then keeps the connection open and pushes new messages as they arrive.
//
// Wildcard: GET /listen?topics=a,b,c subscribes to multiple topics on one stream.

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

export const sseListen = new Elysia()
    .get(
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

                    // Backfill (since)
                    if (since !== null && Number.isFinite(since)) {
                        const backlog = await prisma.message.findMany({
                            orderBy: { createdAt: "asc" },
                            take: 200,
                            where: {
                                createdAt: { gt: new Date(since) },
                                topicId: topic.id,
                            },
                        });
                        for (const m of backlog) {
                            send("message", {
                                ...serializeMessage(m),
                                topicName: topic.name,
                            });
                        }
                    }

                    const unsubscribe = bus.subscribe(topic.name, (e: MessageEvent) =>
                        send("message", e),
                    );

                    // Heartbeat every 25s to keep connections alive through proxies
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
    )
    .get("/listen", async ({ query, request, set }) => {
        const topics = (query.topics ?? "")
            .split(",")
            .map((subscription) => subscription.trim())
            .filter(Boolean);

        Object.assign(set.headers, sseHeaders());

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                const encoder = new TextEncoder();
                const send = (event: string, data: unknown) =>
                    controller.enqueue(encoder.encode(formatEvent(event, data)));

                send("hello", {
                    connectedAt: Date.now(),
                    topics,
                });

                const unsubscribers = topics.length
                    ? topics.map((name) => bus.subscribe(name, (e) => send("message", e)))
                    : [bus.subscribe("*", (e) => send("message", e))];

                const heartbeat = setInterval(() => {
                    try {
                        controller.enqueue(encoder.encode(": ping\n\n"));
                    } catch {
                        clearInterval(heartbeat);
                    }
                }, 25_000);

                request.signal.addEventListener("abort", () => {
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
    });
