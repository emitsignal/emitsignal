import Elysia, { t } from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { authAwareBeforeHandle } from '#/http/plugins/rate-limit-plugin';
import { prisma } from '#/lib/prisma';
import { uploadAnonLimiter, uploadAuthLimiter } from '#/lib/rate-limit';
import { FileStorageService } from '#/lib/storage';
import { isAllowedMimeType } from '#/lib/storage/provider';
import { getUserPlan } from '#/services/billing/get-user-plan';
import { PLANS } from '#/services/billing/plans';
import { attachmentExpiresAt, messageRetentionDays } from '#/services/billing/retention';
import { resolveTopicCapabilities } from '#/services/topic-access';

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
            include: {
                topic: { select: { accessMode: true, id: true, ownerId: true } },
            },
            where: { id: params.id },
        });

        if (!message) {
            return status(404, { error: 'message_not_found' });
        }

        const userId = await resolveUserId({ headers });

        const capabilities = await resolveTopicCapabilities(message.topic, userId);

        if (!capabilities.canRead) {
            return status(404, { error: 'message_not_found' });
        }

        const isSender = userId !== null && message.senderId === userId;

        if (!capabilities.canPublish && !isSender) {
            return status(403, {
                error: 'forbidden',
                message: 'not allowed to attach files to this message',
            });
        }

        const existingCount = await prisma.attachment.count({
            where: { messageId: params.id },
        });

        if (existingCount > 0) {
            return status(409, { error: 'attachment_already_exists' });
        }

        const plan = userId ? await getUserPlan(userId) : null;

        const expiresAt = attachmentExpiresAt(new Date(), messageRetentionDays(plan));
        const limits = plan ? PLANS[plan].limits : PLANS.free.limits;

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

            if (file.size > limits.attachmentMaxBytes) {
                const maxMegabytes = Math.floor(limits.attachmentMaxBytes / (1024 * 1024));

                return status(400, {
                    error: 'file_too_large',
                    filename: file.name,
                    maxSizeBytes: limits.attachmentMaxBytes,
                    message: `File "${file.name}" exceeds the ${maxMegabytes} MB limit for your plan.`,
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
        beforeHandle: authAwareBeforeHandle(uploadAnonLimiter, uploadAuthLimiter, {
            failClosedWhenAnonymous: true,
        }),
        body: t.Object({
            files: t.Files(),
        }),
    },
);
