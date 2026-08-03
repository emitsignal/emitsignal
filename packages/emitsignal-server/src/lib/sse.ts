// Shared SSE transport plumbing: frame encoding, connection headers, and the
// heartbeat/cleanup lifecycle. Nothing here knows about topics or webhooks —
// callers supply what to subscribe to via `onStart`.

import { duration } from '#/utils/duration';

import type { SseSlot } from './rate-limit';

// Passing `null` as the event name emits a bare `data: ...` frame, which is
// what the webhook delivery stream sends.
export type SseSend = (event: null | string, data: unknown) => void;

interface SseStreamOptions {
    // Wire up subscriptions (and any initial replay) and return an unsubscribe
    // function to be run on cleanup.
    onStart: (send: SseSend) => (() => void) | Promise<() => void>;
    request: Request;
    slot: SseSlot;
}

// Kept below the server's 120s idleTimeout so an idle connection is never
// reaped as dead.
const HEARTBEAT_MS = duration.seconds(25).as('ms');

export function createSseStream({ onStart, request, slot }: SseStreamOptions) {
    return new ReadableStream<Uint8Array>({
        async start(controller) {
            const encoder = new TextEncoder();

            let heartbeat: null | ReturnType<typeof setInterval> = null;
            let unsubscribe: (() => void) | null = null;
            let done = false;

            const send: SseSend = (event, data) => {
                try {
                    controller.enqueue(encoder.encode(formatEvent(event, data)));
                } catch {
                    // stream already closed — the abort handler will clean up
                }
            };

            const cleanup = async () => {
                if (done) {
                    return;
                }

                done = true;

                if (heartbeat) {
                    clearInterval(heartbeat);
                }

                await slot.release();
                unsubscribe?.();
                try {
                    controller.close();
                } catch {
                    // already closed
                }
            };

            // Registered before `onStart` runs: replaying a backlog can take a
            // while, and a client that disconnects mid-replay must still give
            // its connection slot back.
            request.signal.addEventListener('abort', cleanup);

            unsubscribe = await onStart(send);

            if (done) {
                unsubscribe();

                return;
            }

            heartbeat = setInterval(async () => {
                try {
                    controller.enqueue(encoder.encode(': ping\n\n'));

                    await slot.refresh();
                } catch {
                    await cleanup();
                }
            }, HEARTBEAT_MS);
        },
    });
}

export function formatEvent(event: null | string, data: unknown) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;

    if (event === null) {
        return payload;
    }

    return `event: ${event}\n${payload}`;
}

export function sseHeaders() {
    return {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'X-Accel-Buffering': 'no',
    };
}
