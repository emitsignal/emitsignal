import type { Action } from './actions';

import { prisma } from './prisma';

export const TOPIC_NAME_RE = /^[a-z0-9][a-z0-9/_-]*[a-z0-9]$/i;

export async function getOrCreateTopic(name: string, ownerId?: string) {
    const existing = await prisma.topic.findUnique({ where: { name } });

    if (existing) {
        return existing;
    }

    return prisma.topic.create({
        data: {
            description: '',
            displayName: name,
            isPublic: true,
            name,
            ownerId,
        },
    });
}

export function parseActions(raw: string): Action[] {
    if (!raw) {
        return [];
    }

    try {
        const actions = JSON.parse(raw);

        if (!Array.isArray(actions)) {
            return [];
        }

        return actions.filter(
            (action: unknown): action is Action =>
                typeof action === 'object' &&
                action !== null &&
                ((action as Action).type === 'acknowledge' || (action as Action).type === 'view'),
        );
    } catch {
        return [];
    }
}

export function parseTags(raw: string): string[] {
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);

        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

export function serializeMessage(
    message: {
        actions: string;
        body: string;
        createdAt: Date;
        id: string;
        priority: number;
        tags: string;
        title: string;
        topicId: string;
    },
    acknowledgmentCount = 0,
) {
    return {
        acknowledgmentCount,
        actions: parseActions(message.actions),
        body: message.body,
        createdAt: message.createdAt.getTime(),
        id: message.id,
        priority: message.priority,
        tags: parseTags(message.tags),
        title: message.title,
        topicId: message.topicId,
    };
}

export function serializeTags(tags: string[] | undefined): string {
    return JSON.stringify(tags ?? []);
}
