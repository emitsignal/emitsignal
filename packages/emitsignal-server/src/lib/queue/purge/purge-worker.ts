import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { ConnectionOptions, Worker } from 'bullmq';

import type { PurgeJob } from './types';

import { logger } from '../../logger';
import { prisma } from '../../prisma';
import { FileStorageService } from '../../storage';
import { redisConnection } from '../connection';

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

                        if (job.data.kind === 'signals') {
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
