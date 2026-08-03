import { prisma } from '#/lib/prisma';
import { FileStorageService } from '#/lib/storage';
import { parseActions } from '#/utils/actions';
import { parseMediaRef, parseMediaRefs } from '#/utils/media-refs';

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
