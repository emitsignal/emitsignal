import { ConnectionOptions, Queue } from 'bullmq';

import type { PurgeJob } from './types';

import { duration } from '../../duration';
import { redisConnection } from '../connection';

export const purgeQueue = new Queue<PurgeJob, void, 'purge-signals' | 'purge-storage'>('purge', {
    connection: redisConnection as ConnectionOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 1000, type: 'exponential' },
        removeOnComplete: { age: duration.hours(1).as('seconds') },
        removeOnFail: { age: duration.hours(24).as('seconds') },
    },
});
