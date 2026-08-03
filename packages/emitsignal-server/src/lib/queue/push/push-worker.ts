import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { ConnectionOptions, Worker } from 'bullmq';

import type { PushJob } from '#/lib/push';

import { logger } from '#/lib/logger';
import { sendPushNotifications } from '#/lib/push';
import { redisConnection } from '#/lib/queue/connection';

const tracer = trace.getTracer('emitsignal.worker');

export function createPushWorker(): Worker<PushJob> {
    const worker = new Worker<PushJob>(
        'push',
        async (job) => {
            await tracer.startActiveSpan(
                'worker.push.process',
                {
                    attributes: {
                        'job.id': job.id ?? 'unknown',
                        'job.name': job.name,
                        'messaging.destination': 'push',
                        'messaging.system': 'bullmq',
                        'topic.name': job.data.topicName,
                    },
                    kind: SpanKind.CONSUMER,
                },
                async (span) => {
                    try {
                        logger.info(
                            { jobId: job.id, topicName: job.data.topicName },
                            'processing push job',
                        );

                        await sendPushNotifications(job.data);

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
        logger.info({ jobId: job.id }, 'push job completed');
    });

    worker.on('failed', (job, err) => {
        logger.error({ err, jobId: job?.id }, 'push job failed');
    });

    return worker;
}
