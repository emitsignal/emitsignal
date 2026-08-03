import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { ConnectionOptions, Worker } from 'bullmq';

import { bus } from '#/lib/event-bus';
import { logger } from '#/lib/logger';
import { prisma } from '#/lib/prisma';
import { redisConnection } from '#/lib/queue/connection';
import { pushQueue } from '#/lib/queue/push/push-queue';
import { getUserPlan } from '#/services/billing/get-user-plan';
import { messageExpiresAt, messageRetentionDays } from '#/services/billing/retention';
import { serializeMessage } from '#/services/message';
import { parseActions } from '#/utils/actions';

import type { ScheduleJob } from './schedule-queue';

const tracer = trace.getTracer('emitsignal.worker');

export function createScheduleWorker(): Worker<ScheduleJob> {
    const worker = new Worker<ScheduleJob>(
        'schedule',
        async (job) => {
            const messageId = job.data.messageId;

            await tracer.startActiveSpan(
                'worker.schedule.process',
                {
                    attributes: {
                        'job.id': job.id ?? 'unknown',
                        'job.name': job.name,
                        'message.id': messageId,
                        'messaging.destination': 'schedule',
                        'messaging.system': 'bullmq',
                    },
                    kind: SpanKind.CONSUMER,
                },
                async (span) => {
                    try {
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

                            span.setStatus({ code: SpanStatusCode.OK });

                            return;
                        }

                        const event = await serializeMessage(
                            { ...message, topicId: message.topic.id },
                            0,
                            true,
                        );

                        bus.publish(message.topic.name, {
                            ...event,
                            topicName: message.topic.name,
                        });

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

                        const deliveredAt = new Date();
                        const plan = message.senderId ? await getUserPlan(message.senderId) : null;

                        await prisma.message.update({
                            data: {
                                deliveredAt,
                                expiresAt: messageExpiresAt(
                                    deliveredAt,
                                    messageRetentionDays(plan),
                                ),
                            },
                            where: { id: message.id },
                        });

                        logger.info(
                            { messageId },
                            'schedule job completed: SSE emitted, push enqueued',
                        );

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
        logger.info({ jobId: job.id }, 'schedule job completed');
    });

    worker.on('failed', (job, err) => {
        logger.error({ err, jobId: job?.id }, 'schedule job failed');
    });

    return worker;
}
