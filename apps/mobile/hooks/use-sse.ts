// SSE consumer for React Native. Uses fetch + ReadableStream — no EventSource polyfill needed.
// Reconnects with exponential backoff. Calls `onEvent(name, data)` for each parsed frame.

import { useEffect, useRef } from "react";

interface SSEOptions {
    url: string | null;
    onEvent: (event: string, data: unknown) => void;
    onOpen?: () => void;
    onError?: (err: unknown) => void;
}

export function useSSE({ url, onEvent, onOpen, onError }: SSEOptions) {
    const onEventRef = useRef(onEvent);
    const onOpenRef = useRef(onOpen);
    const onErrorRef = useRef(onError);

    onEventRef.current = onEvent;
    onOpenRef.current = onOpen;
    onErrorRef.current = onError;

    useEffect(() => {
        if (!url) return;

        let cancelled = false;
        const ctrl = new AbortController();
        let backoff = 1000;

        const connect = async () => {
            while (!cancelled) {
                try {
                    const res = await fetch(url, {
                        method: "GET",
                        headers: { Accept: "text/event-stream" },
                        signal: ctrl.signal,
                    });
                    if (!res.ok || !res.body) {
                        throw new Error(`SSE failed: ${res.status}`);
                    }

                    onOpenRef.current?.();
                    backoff = 1000;

                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = "";

                    while (!cancelled) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });

                        // Parse SSE frames (separated by blank lines)
                        let idx: number;
                        while ((idx = buffer.indexOf("\n\n")) !== -1) {
                            const frame = buffer.slice(0, idx);
                            buffer = buffer.slice(idx + 2);
                            parseFrame(frame, onEventRef.current);
                        }
                    }
                } catch (err) {
                    if (cancelled) return;
                    onErrorRef.current?.(err);
                }

                if (cancelled) return;
                await new Promise((r) => setTimeout(r, backoff));
                backoff = Math.min(backoff * 2, 30_000);
            }
        };

        connect();

        return () => {
            cancelled = true;
            ctrl.abort();
        };
    }, [url]);
}

function parseFrame(
    frame: string,
    onEvent: (event: string, data: unknown) => void,
) {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of frame.split("\n")) {
        if (line.startsWith(":")) continue; // comment / ping
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) return;
    const raw = dataLines.join("\n");
    try {
        onEvent(event, JSON.parse(raw));
    } catch {
        onEvent(event, raw);
    }
}
