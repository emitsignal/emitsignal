import { ConnectionOptions, Queue } from 'bullmq';

import type { EmailOptions } from '#/lib/email/provider';

import { redisConnection } from '#/lib/queue/connection';
import { Traced } from '#/lib/trace-context';
import { duration } from '#/utils/duration';

export const emailQueue = new Queue<Traced<EmailOptions>>('email', {
    connection: redisConnection as ConnectionOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: { delay: 1000, type: 'exponential' },
        removeOnComplete: { age: duration.hours(1).as('seconds') },
        removeOnFail: { age: duration.hours(24).as('seconds') },
    },
});
