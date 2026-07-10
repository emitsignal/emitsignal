import Elysia from 'elysia';
import path from 'node:path';

import { prisma } from '../../lib/prisma';
import { resolveTopicCapabilities } from '../../lib/topic-access';
import { environment } from '../../schema/environment';
import { resolveUserId } from '../auth/plugin';

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

    // Avatars live under `avatars/` and are intentionally public. Any other
    // key is an attachment: enforce the owning topic's access mode so private
    // attachments are not world-readable by whoever learns the storage key.
    if (!storageKey.startsWith('avatars/')) {
        const attachment = await prisma.attachment.findFirst({
            select: {
                message: {
                    select: {
                        topic: {
                            select: { accessMode: true, id: true, ownerId: true },
                        },
                    },
                },
            },
            where: { storageKey },
        });

        if (attachment) {
            const userId = await resolveUserId({ headers });
            const capabilities = await resolveTopicCapabilities(attachment.message.topic, userId);

            if (!capabilities.canRead) {
                return status(404);
            }
        }
    }

    const file = Bun.file(fileName);

    if (!(await file.exists())) {
        return status(404);
    }

    return file;
});
