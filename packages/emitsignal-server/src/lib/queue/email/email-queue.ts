import { Queue } from 'bullmq';

import type { EmailOptions } from '../../email/provider';

import { redisConnection } from '../connection';

export const emailQueue = new Queue<EmailOptions>('email', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 1000, type: 'exponential' },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
    },
});
