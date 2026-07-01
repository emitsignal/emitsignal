import type { MediaRef } from '@emitsignal/shared';

import { isValidTopicName } from '@emitsignal/shared';

import type { Action } from './actions';

import { getUserPlan } from './billing/get-user-plan';
import { PlanLimitError, PLANS } from './billing/plans';
import { topicNameCache } from './cache';
import { prisma } from './prisma';
import { FileStorageService } from './storage';

export { isValidTopicName, TOPIC_NAME_MAX_LENGTH, TOPIC_NAME_REGEX } from '@emitsignal/shared';

export class TopicNameError extends Error {
    constructor(message = 'invalid topic name') {
        super(message);
        this.name = 'TopicNameError';
    }
}

export async function getOrCreateTopic(topicName: string, ownerId?: string) {
    const name = topicName.toLowerCase();

    if (!isValidTopicName(name)) {
        throw new TopicNameError();
    }

    const cached = topicNameCache.get(name);

    if (cached) {
        return cached;
    }

    const existing = await prisma.topic.findUnique({ where: { name } });

    if (existing) {
        topicNameCache.set(name, existing);

        return existing;
    }

    if (ownerId) {
        const plan = await getUserPlan(ownerId);
        const limit = PLANS[plan].limits.maxOwnedTopics;
        const ownedCount = await prisma.topic.count({ where: { ownerId } });

        if (ownedCount >= limit) {
            throw new PlanLimitError('owned_topics', plan, limit);
        }
    }

    const topic = await prisma.topic
        .create({
            data: {
                description: '',
                displayName: name,
                isPublic: true,
                name,
                ownerId,
            },
        })
        .catch(async (error: unknown) => {
            // Concurrent create of the same topic — fetch the winner
            if ((error as { code?: string }).code === 'P2002') {
                const topic = await prisma.topic.findUnique({ where: { name } });

                if (topic) {
                    return topic;
                }
            }

            throw error;
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

export function parseMediaRef(raw: null | string): MediaRef | null {
    const refs = parseMediaRefs(raw ?? '');

    return refs[0] ?? null;
}

export function parseMediaRefs(raw: string): MediaRef[] {
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        const items = Array.isArray(parsed) ? parsed : [parsed];

        return items
            .filter(
                (item: unknown): item is MediaRef =>
                    typeof item === 'object' &&
                    item !== null &&
                    typeof (item as MediaRef).href === 'string',
            )
            .map((item) => {
                const ref: MediaRef = { href: item.href };

                if (typeof item.title === 'string' && item.title) {
                    ref.title = item.title;
                }

                return ref;
            });
    } catch {
        return [];
    }
}

export function parseTagsQueryParam(raw: string | undefined): string[] {
    if (!raw) {
        return [];
    }

    return Array.from(
        new Set(
            raw
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
        ),
    );
}

export async function serializeMessage(
    message: {
        actions: string;
        bannerImage?: null | string;
        body: string;
        createdAt: Date;
        id: string;
        inlineAttachments?: string;
        inlineImages?: string;
        priority: number;
        tags: string[];
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
        bannerImage: parseMediaRef(message.bannerImage ?? null),
        body: message.body,
        createdAt: message.createdAt.getTime(),
        id: message.id,
        inlineAttachments: parseMediaRefs(message.inlineAttachments ?? ''),
        inlineImages: parseMediaRefs(message.inlineImages ?? ''),
        priority: message.priority,
        tags: message.tags,
        title: message.title,
        topicId: message.topicId,
    };
}
