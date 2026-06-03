import type { Action } from './actions';

import { topicNameCache } from './cache';
import { prisma } from './prisma';
import { FileStorageService } from './storage';

export const TOPIC_NAME_REGEX = /^[a-z0-9][a-z0-9/_-]*[a-z0-9]$/i;

export async function getOrCreateTopic(topicName: string, ownerId?: string) {
    const name = topicName.toLowerCase();

    const cached = topicNameCache.get(name);

    if (cached) {
        return cached;
    }

    const topic = await prisma.topic.upsert({
        create: {
            description: '',
            displayName: name,
            isPublic: true,
            name,
            ownerId,
        },
        update: {},
        where: { name },
    });

    topicNameCache.set(name, topic);

    return topic;
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

export async function serializeMessage(
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
    includeAttachments = false,
) {
    const attachments: Array<{
        filename: string;
        mimeType: string;
        size: number;
        storageKey: string;
        url: string;
    }> = [];

    if (includeAttachments) {
        const dbAttachments = await prisma.attachment.findMany({
            select: { filename: true, mimeType: true, size: true, storageKey: true },
            where: { messageId: message.id },
        });

        const resolved = await Promise.all(
            dbAttachments.map(async (attachment) => {
                const url = await FileStorageService.provider.getUrl(attachment.storageKey);

                return {
                    filename: attachment.filename,
                    mimeType: attachment.mimeType,
                    size: attachment.size,
                    storageKey: attachment.storageKey,
                    url,
                };
            }),
        );

        attachments.push(...resolved);
    }

    return {
        acknowledgmentCount,
        actions: parseActions(message.actions),
        attachments,
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
