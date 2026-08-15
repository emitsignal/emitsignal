import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { ConnectionOptions, Worker } from 'bullmq';

import type { PushJob } from '#/services/push';

import { logger } from '#/lib/logger';
import { redisConnection } from '#/lib/queue/connection';
import { traceContextFrom, Traced } from '#/lib/trace-context';
import { sendPushNotifications } from '#/services/push';

const tracer = trace.getTracer('emitsignal.worker');

export function createPushWorker(): Worker<Traced<PushJob>> {
    const worker = new Worker<Traced<PushJob>>(
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
                traceContextFrom(job.data.traceContext),
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
        logger.info({ jobId: job.id, topicName: job.data.topicName }, 'push job completed');
    });

    worker.on('failed', (job, error) => {
        logger.error(
            {
                attempt: job?.attemptsMade,
                attempts: job?.opts.attempts,
                error,
                jobId: job?.id,
                topicName: job?.data.topicName,
            },
            'push job failed',
        );
    });

    return worker;
}
