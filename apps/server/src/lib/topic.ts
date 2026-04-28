import { prisma } from "./prisma";

export const TOPIC_NAME_RE = /^[a-z0-9][a-z0-9/_-]*[a-z0-9]$/i;

export async function getOrCreateTopic(name: string, ownerId?: string) {
    const existing = await prisma.topic.findUnique({ where: { name } });
    if (existing) return existing;

    return prisma.topic.create({
        data: {
            name,
            displayName: name,
            description: "",
            isPublic: true,
            ownerId,
        },
    });
}

export function serializeMessage(m: {
    id: string;
    topicId: string;
    title: string;
    body: string;
    priority: number;
    tags: string;
    createdAt: Date;
}) {
    return {
        id: m.id,
        topicId: m.topicId,
        title: m.title,
        body: m.body,
        priority: m.priority,
        tags: parseTags(m.tags),
        createdAt: m.createdAt.getTime(),
    };
}

export function parseTags(raw: string): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

export function serializeTags(tags: string[] | undefined): string {
    return JSON.stringify(tags ?? []);
}
