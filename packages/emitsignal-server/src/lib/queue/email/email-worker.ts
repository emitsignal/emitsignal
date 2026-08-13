import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { ConnectionOptions, Worker } from 'bullmq';

import type { EmailOptions } from '#/lib/email/provider';

import { Email } from '#/lib/email';
import { logger } from '#/lib/logger';
import { redisConnection } from '#/lib/queue/connection';
import { traceContextFrom, Traced } from '#/lib/trace-context';

const tracer = trace.getTracer('emitsignal.worker');

export function createEmailWorker(): Worker<Traced<EmailOptions>> {
    const worker = new Worker<Traced<EmailOptions>>(
        'email',
        async (job) => {
            await tracer.startActiveSpan(
                'worker.email.process',
                {
                    attributes: {
                        'job.id': job.id ?? 'unknown',
                        'job.name': job.name,
                        'messaging.destination': 'email',
                        'messaging.system': 'bullmq',
                    },
                    kind: SpanKind.CONSUMER,
                },
                traceContextFrom(job.data.traceContext),
                async (span) => {
                    try {
                        logger.info({ jobId: job.id, to: job.data.to }, 'processing email job');

                        // Providers read named fields, so the extra traceContext is inert.
                        await Email.provider.send(job.data);

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
        logger.info({ jobId: job.id }, 'email job completed');
    });

    worker.on('failed', (job, err) => {
        logger.error({ err, jobId: job?.id }, 'email job failed');
    });

    return worker;
}
