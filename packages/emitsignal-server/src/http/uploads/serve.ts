import Elysia from 'elysia';
import path from 'node:path';

import { prisma } from '../../lib/prisma';
import { resolveTopicCapabilities } from '../../lib/topic-access';
import { environment } from '../../schema/environment';
import { resolveUserId } from '../auth/plugin';

const HARDENED_HEADERS: Record<string, string> = {
    'content-security-policy': "default-src 'none'; sandbox",
    'x-content-type-options': 'nosniff',
};

export const serveUpload = new Elysia().get('/uploads/*', async ({ headers, params, status }) => {
    if (environment.FILE_STORAGE_PROVIDER === 's3') {
        return status(501);
    }

    const storageKey = params['*'];

    const base = path.resolve(environment.UPLOAD_DIR);
    const fileName = path.resolve(base, storageKey);

    if (!fileName.startsWith(base + path.sep) && base !== fileName) {
        return status(403);
    }

    let attachmentMimeType: null | string = null;
    const isAvatar = storageKey.startsWith('avatars/');

    if (!isAvatar) {
        const attachment = await prisma.attachment.findFirst({
            select: {
                message: {
                    select: {
                        topic: {
                            select: { accessMode: true, id: true, ownerId: true },
                        },
                    },
                },
                mimeType: true,
            },
            where: { storageKey },
        });

        if (!attachment) {
            return status(404);
        }

        const userId = await resolveUserId({ headers });
        const capabilities = await resolveTopicCapabilities(attachment.message.topic, userId);

        if (!capabilities.canRead) {
            return status(404);
        }

        attachmentMimeType = attachment.mimeType;
    }

    const file = Bun.file(fileName);

    if (!(await file.exists())) {
        return status(404);
    }

    return new Response(file, {
        headers: {
            ...HARDENED_HEADERS,
            ...(isAvatar
                ? { 'content-type': file.type }
                : {
                      'content-disposition': 'attachment',
                      'content-type': attachmentMimeType ?? 'application/octet-stream',
                  }),
        },
    });
});
