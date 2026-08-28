import type { SharedMessage } from '@emitsignal/shared/api';

import { generateShareId } from '@emitsignal/shared/share';

import { prisma } from '#/lib/prisma';
import { serializeMessage } from '#/services/message';
import { resolveTopicCapabilities } from '#/services/topic-access';

export type EnsureShareResult =
    | { accessMode: string; kind: 'topic_not_public'; topicName: string }
    | { kind: 'not_found' }
    | { kind: 'ok'; shareId: string };

const SHARE_ID_ATTEMPTS = 5;

const TOPIC_SELECT = { accessMode: true, id: true, name: true, ownerId: true } as const;

export async function ensureMessageShareId(
    messageId: string,
    userId: null | string,
): Promise<EnsureShareResult> {
    const message = await prisma.message.findUnique({
        select: { id: true, shareId: true, topic: { select: TOPIC_SELECT } },
        where: { id: messageId },
    });

    if (!message) {
        return { kind: 'not_found' };
    }

    const callerCapabilities = await resolveTopicCapabilities(message.topic, userId);

    if (!callerCapabilities.canRead) {
        return { kind: 'not_found' };
    }

    if (!(await isPubliclyReadable(message.topic))) {
        return {
            accessMode: message.topic.accessMode,
            kind: 'topic_not_public',
            topicName: message.topic.name,
        };
    }

    if (message.shareId) {
        return { kind: 'ok', shareId: message.shareId };
    }

    for (let attempt = 0; attempt < SHARE_ID_ATTEMPTS; attempt += 1) {
        const shareId = generateShareId();

        try {
            await prisma.message.update({
                data: { shareId },
                where: { id: message.id },
            });

            return { kind: 'ok', shareId };
        } catch (error) {
            if (!isUniqueViolation(error)) {
                throw error;
            }
        }
    }

    throw new Error('share_id_generation_failed');
}

export async function getSharedMessage(shareId: string): Promise<null | SharedMessage> {
    const message = await prisma.message.findUnique({
        include: {
            sender: { select: { image: true, name: true } },
            topic: {
                select: {
                    ...TOPIC_SELECT,
                    _count: { select: { subscriptions: true } },
                    displayName: true,
                },
            },
        },
        where: { shareId },
    });

    if (!message || !(await isPubliclyReadable(message.topic))) {
        return null;
    }

    const acknowledgmentCount = await prisma.acknowledgment.count({
        where: { messageId: message.id },
    });

    const serialized = await serializeMessage(message, acknowledgmentCount, true);

    return {
        message: {
            ...serialized,
            priority: serialized.priority as SharedMessage['message']['priority'],
            topicName: message.topic.name,
        },
        sender: message.sender,
        topic: {
            accessMode: message.topic.accessMode as SharedMessage['topic']['accessMode'],
            displayName: message.topic.displayName,
            name: message.topic.name,
            subscriberCount: message.topic._count.subscriptions,
        },
    };
}

function isPubliclyReadable(topic: {
    accessMode: string;
    id: string;
    ownerId: null | string;
}): Promise<boolean> {
    return resolveTopicCapabilities(topic, null).then((capabilities) => capabilities.canRead);
}

function isUniqueViolation(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: unknown }).code === 'P2002'
    );
}
