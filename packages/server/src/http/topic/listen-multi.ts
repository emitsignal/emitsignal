import Elysia from "elysia";

import { bus } from "../../lib/event-bus";

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

export const listenMulti = new Elysia().get("/listen", async ({ query, request, set }) => {
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
