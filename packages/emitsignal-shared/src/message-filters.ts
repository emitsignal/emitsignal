import type { Message } from './api.ts';

export interface MessageFilterParams {
    minPriority?: number;
    tags?: string[];
}

export function matchesMessageFilter(message: Message, filters?: MessageFilterParams): boolean {
    if (filters?.minPriority !== undefined && message.priority < filters.minPriority) {
        return false;
    }

    if (filters?.tags && filters.tags.length > 0) {
        return message.tags?.some((tag) => filters.tags!.includes(tag)) ?? false;
    }

    return true;
}
