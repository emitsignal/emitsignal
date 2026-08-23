import type { Message } from '#/lib/api';

export interface RealtimeMessage extends Message {
    topicName: string;
}

export type RealtimeStatus = 'closed' | 'connecting' | 'error' | 'open';

// A route transition unmounts one component and mounts the next in separate
// commits. Waiting this long before committing a topic set lets both halves land
// so an unchanged set never tears the connection down.
export const REALTIME_SETTLE_DELAY_MS = 200;

export const REALTIME_MAX_REPLAY_WINDOW_MS = 5 * 60_000;

export function isRealtimeMessage(value: unknown): value is RealtimeMessage {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const candidate = value as Partial<RealtimeMessage>;

    return (
        typeof candidate.id === 'string' &&
        typeof candidate.topicName === 'string' &&
        typeof candidate.createdAt === 'number' &&
        Number.isFinite(candidate.createdAt)
    );
}

export function topicUnionKey(topicNames: Iterable<string>): string {
    return [...new Set(topicNames)].sort().join(',');
}
