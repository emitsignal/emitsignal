import { LRUCache } from 'lru-cache';

import { Topic } from '../generated/prisma/client';
import { duration } from './duration';

export const topicNameCache = new LRUCache<string, Topic>({
    max: 500,
    ttl: duration.hours(1).as('ms'),
});
