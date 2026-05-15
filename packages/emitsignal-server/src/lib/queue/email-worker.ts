import { Worker } from 'bullmq';

import type { EmailOptions } from '../email/provider';

import { Email } from '../email';
import { logger } from '../logger';
import { redisConnection } from './connection';

export function createEmailWorker(): Worker<EmailOptions> {
    const worker = new Worker<EmailOptions>(
        'email',
        async (job) => {
            logger.info({ jobId: job.id, to: job.data.to }, 'processing email job');

            await Email.provider.send(job.data);
        },
        {
            concurrency: 5,
            connection: redisConnection,
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
