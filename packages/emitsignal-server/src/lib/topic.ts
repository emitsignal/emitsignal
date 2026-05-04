import { prisma } from "./prisma";

export const TOPIC_NAME_RE = /^[a-z0-9][a-z0-9/_-]*[a-z0-9]$/i;

export async function getOrCreateTopic(name: string, ownerId?: string) {
    const existing = await prisma.topic.findUnique({ where: { name } });
    if (existing) {
        return existing;
    }

    return prisma.topic.create({
        data: {
            description: "",
            displayName: name,
            isPublic: true,
            name,
            ownerId,
        },
    });
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

export function serializeMessage(m: {
    body: string;
    createdAt: Date;
    id: string;
    priority: number;
    tags: string;
    title: string;
    topicId: string;
}) {
    return {
        ...m,
        createdAt: m.createdAt.getTime(),
        tags: parseTags(m.tags),
    };
}

export function serializeTags(tags: string[] | undefined): string {
    return JSON.stringify(tags ?? []);
}
