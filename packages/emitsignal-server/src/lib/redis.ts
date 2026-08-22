import Redis from 'ioredis';

import { logger } from '#/lib/logger';
import { environment } from '#/schema/environment';

// maxRetriesPerRequest: 0 is what lets callers fail open instead of stalling a
// request behind a retrying command. BullMQ needs the opposite and keeps its own
// connection in `#/lib/queue/connection`.
export const redis = new Redis(environment.REDIS_URL, {
    enableReadyCheck: false,
    maxRetriesPerRequest: 0,
});

redis.on('error', (error: Error) => {
    logger.error({ error }, 'redis connection error');
});
