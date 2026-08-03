import { ConnectionOptions, Queue } from 'bullmq';

import { redisConnection } from '#/lib/queue/connection';
import { duration } from '#/utils/duration';

import type { PurgeJob } from './types';

export const purgeQueue = new Queue<
    PurgeJob,
    void,
    'purge-expired' | 'purge-signals' | 'purge-storage'
>('purge', {
    connection: redisConnection as ConnectionOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 1000, type: 'exponential' },
        removeOnComplete: { age: duration.hours(1).as('seconds'), count: 1000 },
        removeOnFail: { age: duration.hours(24).as('seconds'), count: 1000 },
    },
});

// Registers the hourly retention sweep. Idempotent — safe to call from every
// worker replica at boot; BullMQ dedupes by the scheduler id.
export async function scheduleRetentionSweep(): Promise<void> {
    await purgeQueue.upsertJobScheduler(
        'purge-expired',
        { every: duration.hours(1).as('ms') },
        { data: { kind: 'expired' }, name: 'purge-expired' },
    );
}
