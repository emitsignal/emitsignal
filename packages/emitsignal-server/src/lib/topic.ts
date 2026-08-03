import { isValidTopicName } from '@emitsignal/shared';

import { parseActions } from '#/utils/actions';
import { parseMediaRef, parseMediaRefs } from '#/utils/media-refs';

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

export async function getOrCreateTopic(topicName: string) {
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

    // Topics are always created ownerless. Ownership is explicit and paid:
    // see the claim route (POST /topics/:name/claim).
    const topic = await prisma.topic
        .create({
            data: {
                accessMode: 'public',
                description: '',
                displayName: name,
                name,
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
