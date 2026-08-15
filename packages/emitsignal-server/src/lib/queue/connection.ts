import Redis from 'ioredis';

import { logger } from '#/lib/logger';
import { environment } from '#/schema/environment';

export const redisConnection = new Redis(environment.REDIS_URL, {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
});

// ioredis reconnects on its own, so without a listener a queue outage is entirely
// silent: jobs simply stop moving.
redisConnection.on('error', (error: Error) => {
    logger.error({ error }, 'queue redis connection error');
});

redisConnection.on('reconnecting', () => {
    logger.warn('queue redis reconnecting');
});
