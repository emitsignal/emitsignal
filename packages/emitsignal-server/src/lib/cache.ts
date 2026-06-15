import { LRUCache } from 'lru-cache';

import { Topic } from '../generated/prisma/client';
import { duration } from './duration';

// Resolved user id per auth-header fingerprint. Short TTL so logout / session
// revocation is honored within a few seconds while collapsing the 2-3 session
// lookups every request currently makes into at most one DB hit.

export const sessionUserIdCache = new LRUCache<string, { userId: null | string }>({
    max: 1000,
    ttl: duration.seconds(15).as('ms'),
});

export const topicNameCache = new LRUCache<string, Topic>({
    max: 500,
    ttl: duration.hours(1).as('ms'),
});
