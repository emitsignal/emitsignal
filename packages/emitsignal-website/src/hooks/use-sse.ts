import { useEffect, useRef } from 'react';

interface SSEOptions {
    onError?: (error: unknown) => void;
    onEvent: (event: string, data: unknown) => void;
    onOpen?: () => void;
    url: null | string;
}

export function useSSE({ onError, onEvent, onOpen, url }: SSEOptions) {
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

        const eventSource = new EventSource(url);

        eventSource.addEventListener('open', () => {
            onOpenRef.current?.();
        });

        eventSource.addEventListener('error', () => {
            onErrorRef.current?.(new Error('SSE connection error'));
        });

        const handleEvent = (event: MessageEvent) => {
            try {
                onEventRef.current(event.type, JSON.parse(event.data));
            } catch {
                onEventRef.current(event.type, event.data);
            }
        };

        eventSource.addEventListener('message', handleEvent);

        return () => {
            eventSource.removeEventListener('message', handleEvent);
            eventSource.close();
        };
    }, [url]);
}
