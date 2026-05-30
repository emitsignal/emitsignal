import Elysia, { t } from 'elysia';

import { authAwareBeforeHandle } from '../../http/plugins/rate-limit-plugin';
import { prisma } from '../../lib/prisma';
import { uploadAnonLimiter, uploadAuthLimiter } from '../../lib/rate-limit';
import { FileStorageService } from '../../lib/storage';
import { isAllowedMimeType, MAX_FILE_SIZE } from '../../lib/storage/provider';
import { resolveUserId } from '../auth/plugin';

const AUTH_TTL_MS = 15 * 24 * 60 * 60 * 1000; // 15 days
const NO_AUTH_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

export const attachments = new Elysia({ prefix: '/messages' }).post(
    '/:id/attachments',
    async ({ body, headers, params, status }) => {
        if (!body.files?.length) {
            return status(400, { error: 'at_least_one_file_required' });
        }

        if (body.files.length > 1) {
            return status(400, {
                error: 'too_many_files',
                message: 'Only one attachment per message is allowed.',
            });
        }

        const message = await prisma.message.findUnique({
            where: { id: params.id },
        });

        if (!message) {
            return status(404, { error: 'message_not_found' });
        }

        const existingCount = await prisma.attachment.count({
            where: { messageId: params.id },
        });

        if (existingCount > 0) {
            return status(409, { error: 'attachment_already_exists' });
        }

        const userId = await resolveUserId({ headers });
        const ttlMs = userId ? AUTH_TTL_MS : NO_AUTH_TTL_MS;
        const expiresAt = new Date(Date.now() + ttlMs);

        const storage = FileStorageService.provider;
        const results = [];

        for (const file of body.files) {
            const mimeType = file.type;

            if (!isAllowedMimeType(mimeType)) {
                return status(400, {
                    error: 'invalid_mime_type',
                    filename: file.name,
                    message: `MIME type "${mimeType}" is not allowed. Only image/* and text/plain are accepted.`,
                });
            }

            if (file.size > MAX_FILE_SIZE) {
                return status(400, {
                    error: 'file_too_large',
                    filename: file.name,
                    maxSizeBytes: MAX_FILE_SIZE,
                    message: `File "${file.name}" exceeds the 25 MB limit.`,
                });
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const metadata = await storage.upload({
                buffer,
                filename: file.name,
                mimeType,
            });

            const attachment = await prisma.attachment.create({
                data: {
                    expiresAt,
                    filename: metadata.filename,
                    messageId: params.id,
                    mimeType: metadata.mimeType,
                    size: metadata.size,
                    storageKey: metadata.storageKey,
                },
                select: {
                    createdAt: true,
                    expiresAt: true,
                    filename: true,
                    id: true,
                    mimeType: true,
                    size: true,
                    storageKey: true,
                },
            });

            results.push(attachment);
        }

        return { attachments: results };
    },
    {
        beforeHandle: authAwareBeforeHandle(uploadAnonLimiter, uploadAuthLimiter),
        body: t.Object({
            files: t.Files(),
        }),
    },
);
