import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { ConnectionOptions, Worker } from 'bullmq';

import type { PurgeJob } from './types';

import { environment } from '../../../schema/environment';
import { duration } from '../../duration';
import { logger } from '../../logger';
import { prisma } from '../../prisma';
import { FileStorageService } from '../../storage';
import { redisConnection } from '../connection';

// How many attachment/message rows to remove per sweep pass, looped until the
// backlog is drained. Bounds the memory and the size of each DELETE so a large
// backlog can't spike the worker.
const RETENTION_BATCH_SIZE = 1000;

const tracer = trace.getTracer('emitsignal.worker');

export function createPurgeWorker(): Worker<PurgeJob> {
    const worker = new Worker<PurgeJob>(
        'purge',
        async (job) => {
            await tracer.startActiveSpan(
                'worker.purge.process',
                {
                    attributes: {
                        'job.id': job.id ?? 'unknown',
                        'job.name': job.name,
                        'messaging.destination': 'purge',
                        'messaging.system': 'bullmq',
                        'purge.kind': job.data.kind,
                    },
                    kind: SpanKind.CONSUMER,
                },
                async (span) => {
                    try {
                        logger.info({ jobId: job.id, kind: job.data.kind }, 'processing purge job');

                        if (job.data.kind === 'expired') {
                            await purgeExpired();
                        } else if (job.data.kind === 'signals') {
                            await purgeSignals(job.data.userId);
                        } else if (job.data.kind === 'storage') {
                            await deleteStorageKeys(job.data.storageKeys, job.data.avatarKey);
                        }

                        span.setStatus({ code: SpanStatusCode.OK });
                    } catch (error) {
                        span.recordException(
                            error instanceof Error ? error : new Error(String(error)),
                        );
                        span.setStatus({ code: SpanStatusCode.ERROR });

                        throw error;
                    } finally {
                        span.end();
                    }
                },
            );
        },
        {
            concurrency: 5,
            connection: redisConnection as ConnectionOptions,
        },
    );

    worker.on('completed', (job) => {
        logger.info({ jobId: job.id }, 'purge job completed');
    });

    worker.on('failed', (job, err) => {
        logger.error({ err, jobId: job?.id }, 'purge job failed');
    });

    return worker;
}

async function deleteStorageKeys(storageKeys: string[], avatarKey?: string): Promise<void> {
    const storage = FileStorageService.provider;

    // Attachments live in the default (private) bucket; avatars in the public one.
    await Promise.all(storageKeys.map((storageKey) => storage.delete(storageKey)));

    if (avatarKey) {
        await storage.delete(avatarKey, 'public');
    }
}

// Messages the user is responsible for: those in topics they own, plus those they
// sent into topics owned by other people.
function ownedMessagesWhere(userId: string) {
    return { OR: [{ senderId: userId }, { topic: { ownerId: userId } }] };
}

// Repeatable retention sweep. Always removes attachments whose `expiresAt` has
// passed (deleting the file first, then the row). When MESSAGE_RETENTION_DAYS is
// configured (> 0), also deletes messages older than that window; their
// attachments/acknowledgments cascade away with them.
async function purgeExpired(): Promise<void> {
    const now = new Date();

    let expiredAttachments = 0;

    // Delete expired attachments in bounded batches until the backlog is drained.
    for (;;) {
        const batch = await prisma.attachment.findMany({
            select: { id: true, storageKey: true },
            take: RETENTION_BATCH_SIZE,
            where: { expiresAt: { lt: now } },
        });

        if (batch.length === 0) {
            break;
        }

        await deleteStorageKeys(batch.map((attachment) => attachment.storageKey));

        await prisma.attachment.deleteMany({
            where: { id: { in: batch.map((attachment) => attachment.id) } },
        });

        expiredAttachments += batch.length;

        if (batch.length < RETENTION_BATCH_SIZE) {
            break;
        }
    }

    let retiredMessages = 0;

    if (environment.MESSAGE_RETENTION_DAYS > 0) {
        const cutoff = new Date(
            now.getTime() - duration.days(environment.MESSAGE_RETENTION_DAYS).as('ms'),
        );

        for (;;) {
            // Remove attachment files for the messages about to be deleted before
            // the rows cascade away, so no storage object is orphaned.
            const attachments = await prisma.attachment.findMany({
                select: { storageKey: true },
                take: RETENTION_BATCH_SIZE,
                where: { message: { createdAt: { lt: cutoff } } },
            });

            await deleteStorageKeys(attachments.map((attachment) => attachment.storageKey));

            const stale = await prisma.message.findMany({
                select: { id: true },
                take: RETENTION_BATCH_SIZE,
                where: { createdAt: { lt: cutoff } },
            });

            if (stale.length === 0) {
                break;
            }

            const { count } = await prisma.message.deleteMany({
                where: { id: { in: stale.map((message) => message.id) } },
            });

            retiredMessages += count;

            if (stale.length < RETENTION_BATCH_SIZE) {
                break;
            }
        }
    }

    logger.info({ expiredAttachments, retiredMessages }, 'retention sweep completed');
}

async function purgeSignals(userId: string): Promise<void> {
    // Remove attachment files before the rows cascade away with their messages.
    const attachments = await prisma.attachment.findMany({
        select: { storageKey: true },
        where: { message: ownedMessagesWhere(userId) },
    });

    await deleteStorageKeys(attachments.map((attachment) => attachment.storageKey));

    // Attachment and Acknowledgment rows cascade from Message; topics are kept.
    const { count } = await prisma.message.deleteMany({ where: ownedMessagesWhere(userId) });

    logger.info({ count, userId }, 'purged signals');
}
