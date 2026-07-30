import { prisma } from './prisma';

export interface TopicCapabilities {
    canPublish: boolean;
    canRead: boolean;
    isOwner: boolean;
    role: null | string;
}

interface TopicAccessInput {
    accessMode: string;
    id: string;
    ownerId: null | string;
}

const PUBLISHER_ROLES = ['owner', 'publisher'];

export async function canPublishToTopicName(
    topicName: string,
    userId: null | string,
): Promise<boolean> {
    const topic = await prisma.topic.findUnique({
        select: { accessMode: true, id: true, ownerId: true },
        where: { name: topicName.toLowerCase() },
    });

    if (!topic) {
        return true;
    }

    return (await resolveTopicCapabilities(topic, userId)).canPublish;
}

// Resolves what a caller may do with a topic. Unclaimed topics (ownerId === null)
// stay fully open for backwards compatibility; enforcement only applies once a
// topic has been explicitly claimed.
export async function resolveTopicCapabilities(
    topic: TopicAccessInput,
    userId: null | string,
): Promise<TopicCapabilities> {
    if (!topic.ownerId) {
        return { canPublish: true, canRead: true, isOwner: false, role: null };
    }

    const isOwner = Boolean(userId) && userId === topic.ownerId;

    let role: null | string = isOwner ? 'owner' : null;

    if (!isOwner && userId) {
        const access = await prisma.topicAccess.findUnique({
            select: { role: true },
            where: { topicId_userId: { topicId: topic.id, userId } },
        });

        role = access?.role ?? null;
    }

    const isMember = role !== null;
    const canPublishAsMember = isOwner || (role !== null && PUBLISHER_ROLES.includes(role));

    switch (topic.accessMode) {
        case 'private':
            return { canPublish: canPublishAsMember, canRead: isMember, isOwner, role };
        case 'readonly':
            return { canPublish: canPublishAsMember, canRead: true, isOwner, role };
        default:
            // "public" and any unknown/legacy value → fully open.
            return { canPublish: true, canRead: true, isOwner, role };
    }
}
