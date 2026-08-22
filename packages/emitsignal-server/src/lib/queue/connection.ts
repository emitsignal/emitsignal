import Redis from 'ioredis';

import { logger } from '#/lib/logger';
import { environment } from '#/schema/environment';

// maxRetriesPerRequest: null because workers park on blocking commands (BZPOPMIN
// for up to 10s); failing those fast would break job fetching. Request paths want
// the opposite and use `#/lib/redis`.
export const redisConnection = new Redis(environment.REDIS_URL, {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
});

redisConnection.on('error', (error: Error) => {
    logger.error({ error }, 'queue redis connection error');
});

redisConnection.on('reconnecting', () => {
    logger.warn('queue redis reconnecting');
});
