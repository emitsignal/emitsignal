import { Worker } from 'bullmq';

import type { ScheduleJob } from './schedule-queue';

import { bus } from '../../event-bus';
import { logger } from '../../logger';
import { prisma } from '../../prisma';
import { parseActions, serializeMessage } from '../../topic';
import { redisConnection } from '../connection';
import { pushQueue } from '../push/push-queue';

export function createScheduleWorker(): Worker<ScheduleJob> {
    const worker = new Worker<ScheduleJob>(
        'schedule',
        async (job) => {
            const messageId = job.data.messageId;

            logger.info({ jobId: job.id, messageId }, 'processing schedule job');

            const message = await prisma.message.findUnique({
                include: { topic: true },
                where: { id: messageId },
            });

            if (!message || message.deliveredAt) {
                logger.info(
                    { messageId },
                    'schedule job skipped: message deleted or already delivered',
                );

                return;
            }

            const event = await serializeMessage(
                { ...message, topicId: message.topic.id },
                0,
                true,
            );

            bus.publish(message.topic.name, { ...event, topicName: message.topic.name });

            pushQueue.add('push-message', {
                actions: parseActions(message.actions),
                body: message.body,
                messageId: message.id,
                priority: message.priority,
                title: message.title,
                topicDisplayName: message.topic.displayName,
                topicId: message.topic.id,
                topicName: message.topic.name,
            });

            await prisma.message.update({
                data: { deliveredAt: new Date() },
                where: { id: message.id },
            });

            logger.info({ messageId }, 'schedule job completed: SSE emitted, push enqueued');
        },
        {
            concurrency: 5,
            connection: redisConnection,
        },
    );

    worker.on('completed', (job) => {
        logger.info({ jobId: job.id }, 'schedule job completed');
    });

    worker.on('failed', (job, err) => {
        logger.error({ err, jobId: job?.id }, 'schedule job failed');
    });

    return worker;
}
