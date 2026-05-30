import { ConnectionOptions, Queue } from 'bullmq';

import type { EmailOptions } from '../../email/provider';

import { duration } from '../../duration';
import { redisConnection } from '../connection';

export const emailQueue = new Queue<EmailOptions>('email', {
    connection: redisConnection as ConnectionOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 1000, type: 'exponential' },
        removeOnComplete: { age: duration.hours(1).as('seconds') },
        removeOnFail: { age: duration.hours(24).as('seconds') },
    },
});
