import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useEffect, useRef } from 'react';

interface SSEOptions {
    headers?: Record<string, string>;
    onError?: (error: unknown) => void;
    onEvent: (event: string, data: unknown) => void;
    onOpen?: () => void;
    url: null | string;
}

export function useSSE({ headers, onError, onEvent, onOpen, url }: SSEOptions) {
    const onErrorRef = useRef(onError);
    const onEventRef = useRef(onEvent);
    const onOpenRef = useRef(onOpen);

    onErrorRef.current = onError;
    onEventRef.current = onEvent;
    onOpenRef.current = onOpen;

    useEffect(() => {
        if (!url) {
            return;
        }

        const controller = new AbortController();

        fetchEventSource(url, {
            headers,
            onerror(error) {
                onErrorRef.current?.(error);
                throw error;
            },
            onmessage(event) {
                try {
                    onEventRef.current(event.event || 'message', JSON.parse(event.data));
                } catch {
                    onEventRef.current(event.event || 'message', event.data);
                }
            },
            async onopen(response) {
                if (!response.ok) {
                    throw new Error(`SSE open failed: ${response.status}`);
                }
                onOpenRef.current?.();
            },
            openWhenHidden: true,
            signal: controller.signal,
        });

        return () => controller.abort();
    }, [url, headers]);
}
