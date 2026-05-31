import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { ConnectionOptions, Worker } from 'bullmq';

import type { EmailOptions } from '../../email/provider';

import { Email } from '../../email';
import { logger } from '../../logger';
import { redisConnection } from '../connection';

const tracer = trace.getTracer('emitsignal.worker');

export function createEmailWorker(): Worker<EmailOptions> {
    const worker = new Worker<EmailOptions>(
        'email',
        async (job) => {
            const span = tracer.startSpan('worker.email.process', {
                attributes: {
                    'job.id': job.id ?? 'unknown',
                    'job.name': job.name,
                    'messaging.destination': 'email',
                    'messaging.system': 'bullmq',
                },
                kind: SpanKind.CONSUMER,
            });

            try {
                logger.info({ jobId: job.id, to: job.data.to }, 'processing email job');
                await Email.provider.send(job.data);

                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {
                span.recordException(error instanceof Error ? error : new Error(String(error)));
                span.setStatus({ code: SpanStatusCode.ERROR });

                throw error;
            } finally {
                span.end();
            }
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
