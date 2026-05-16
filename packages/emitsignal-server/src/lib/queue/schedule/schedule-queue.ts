import { Queue } from 'bullmq';

import { redisConnection } from '../connection';

export interface ScheduleJob {
    messageId: string;
}

export const scheduleQueue = new Queue<ScheduleJob>('schedule', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 1000, type: 'exponential' },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
    },
});
