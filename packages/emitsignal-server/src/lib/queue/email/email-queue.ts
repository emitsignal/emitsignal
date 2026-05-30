import { ConnectionOptions, Queue } from 'bullmq';

import type { EmailOptions } from '../../email/provider';

import { redisConnection } from '../connection';

export const emailQueue = new Queue<EmailOptions>('email', {
    connection: redisConnection as ConnectionOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 1000, type: 'exponential' },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
    },
});
