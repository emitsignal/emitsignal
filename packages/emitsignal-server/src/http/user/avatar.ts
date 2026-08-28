import Elysia, { t } from 'elysia';
import path from 'node:path';

import { resolveUserId } from '#/http/auth/resolve-user-id';
import { prisma } from '#/lib/prisma';
import { AVATAR_MAX_SIZE, FileStorageService, isAllowedMimeType } from '#/lib/storage';

const AVATAR_EXTENSION_BY_MIME: Record<string, string> = {
    'image/gif': '.gif',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

export const userAvatar = new Elysia({ prefix: '/user' })
    .post(
        '/avatar',
        async ({ body, headers, status }) => {
            const userId = await resolveUserId({ headers });

            if (!userId) {
                return status(401, { error: 'unauthorized' });
            }

            const { file } = body;

            // Reject anything that isn't an allowlisted raster image. This blocks
            // image/svg+xml, which would otherwise be served inline and execute
            // script (stored XSS).
            if (!isAllowedMimeType(file.type) || !file.type.startsWith('image/')) {
                return status(400, { error: 'invalid_mime_type' });
            }

            const ext = AVATAR_EXTENSION_BY_MIME[file.type.trim().toLowerCase()];

            if (!ext) {
                return status(400, { error: 'invalid_mime_type' });
            }

            if (file.size > AVATAR_MAX_SIZE) {
                return status(400, { error: 'payload_too_large' });
            }

            const storageKey = `avatars/${userId}${ext}`;

            const buffer = Buffer.from(await file.arrayBuffer());
            const storage = FileStorageService.provider;

            await storage.upload({
                bucket: 'public',
                buffer,
                filename: file.name || 'avatar',
                mimeType: file.type,
                storageKey,
            });

            const imageUrl = await storage.getUrl(storageKey, 'public');

            await prisma.user.update({
                data: { image: imageUrl },
                where: { id: userId },
            });

            return { imageUrl };
        },
        {
            body: t.Object({
                file: t.File(),
            }),
        },
    )
    .delete('/avatar', async ({ headers, status }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return status(401, { error: 'unauthorized' });
        }

        const user = await prisma.user.findUnique({
            select: { image: true },
            where: { id: userId },
        });

        if (!user?.image) {
            return status(204);
        }

        const ext = path.extname(new URL(user.image).pathname);
        const storageKey = `avatars/${userId}${ext}`;

        await FileStorageService.provider.delete(storageKey, 'public');

        await prisma.user.update({
            data: { image: null },
            where: { id: userId },
        });

        return status(204);
    });
