import { useEffect, useRef } from "react";
import EventSource from "react-native-sse";

interface SSEOptions {
    onError?: (error: unknown) => void;
    onEvent: (event: string, data: unknown) => void;
    onOpen?: () => void;
    url: null | string;
}

export function useSSE({ onError, onEvent, onOpen, url }: SSEOptions) {
    const onEventRef = useRef(onEvent);
    const onOpenRef = useRef(onOpen);
    const onErrorRef = useRef(onError);

    onEventRef.current = onEvent;
    onOpenRef.current = onOpen;
    onErrorRef.current = onError;

    useEffect(() => {
        if (!url) {
            return;
        }

        const es = new EventSource<"hello">(url);

        es.addEventListener("open", () => {
            onOpenRef.current?.();
        });

        es.addEventListener("error", (event) => {
            onErrorRef.current?.(event);
        });

        const handleEvent = (event: { data: null | string; type: string }) => {
            try {
                onEventRef.current(event.type, JSON.parse(event.data ?? ""));
            } catch {
                onEventRef.current(event.type, event.data);
            }
        };

        es.addEventListener("message", handleEvent);
        es.addEventListener("hello", handleEvent);

        return () => {
            es.removeAllEventListeners();
            es.close();
        };
    }, [url]);
}
