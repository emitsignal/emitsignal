import Redis from 'ioredis';

import { environment } from '../../schema/environment';

export const redisConnection = new Redis(environment.REDIS_URL, {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
});
