import { Worker } from 'bullmq';

import type { PushJob } from '../../push';

import { logger } from '../../logger';
import { sendPushNotifications } from '../../push';
import { redisConnection } from '../connection';

export function createPushWorker(): Worker<PushJob> {
    const worker = new Worker<PushJob>(
        'push',
        async (job) => {
            logger.info({ jobId: job.id, topicName: job.data.topicName }, 'processing push job');

            await sendPushNotifications(job.data);
        },
        {
            concurrency: 5,
            connection: redisConnection,
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
