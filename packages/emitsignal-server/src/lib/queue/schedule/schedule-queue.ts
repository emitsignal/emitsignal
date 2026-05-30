import { ConnectionOptions, Queue } from 'bullmq';

import { duration } from '../../duration';
import { redisConnection } from '../connection';

export interface ScheduleJob {
    messageId: string;
}

export const scheduleQueue = new Queue<ScheduleJob, void, 'schedule-delivery'>('schedule', {
    connection: redisConnection as ConnectionOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 1000, type: 'exponential' },
        removeOnComplete: { age: duration.hours(1).as('seconds') },
        removeOnFail: { age: duration.hours(24).as('seconds') },
    },
});
