import { Queue } from 'bullmq';

import type { PushJob } from '../../push-notification';

import { redisConnection } from '../connection';

export const pushQueue = new Queue<PushJob>('push', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 1000, type: 'exponential' },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
    },
});
