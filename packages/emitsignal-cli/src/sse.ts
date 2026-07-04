export interface StreamSseOptions<TEvent> {
    onEvent: (event: TEvent) => void;
    signal: AbortSignal;
    token?: string;
}

/**
 * Consume a server-sent events stream, invoking `onEvent` for every parsed
 * `data:` frame. Malformed frames are skipped; a non-ok response or missing
 * body throws so callers can surface (or reconnect on) the failure.
 */
export async function streamSse<TEvent>(
    url: string,
    { onEvent, signal, token }: StreamSseOptions<TEvent>,
): Promise<void> {
    const headers: Record<string, string> = { Accept: 'text/event-stream' };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers, signal });

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
    }

    if (!response.body) {
        throw new Error('no response body');
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');

        buffer = parts.pop() ?? '';

        for (const part of parts) {
            for (const line of part.split('\n')) {
                if (!line.startsWith('data: ')) {
                    continue;
                }

                let event: TEvent;

                try {
                    event = JSON.parse(line.slice(6)) as TEvent;
                } catch {
                    // malformed SSE frame — ignore
                    continue;
                }

                onEvent(event);
            }
        }
    }
}
