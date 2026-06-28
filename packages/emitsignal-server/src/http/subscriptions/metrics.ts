import Elysia, { t } from 'elysia';

import { Prisma } from '../../generated/prisma/client';
import { duration } from '../../lib/duration';
import { prisma } from '../../lib/prisma';
import { resolveSubscriptions } from './resolve';

interface SubscriptionMetrics {
    messageCount24h: number;
    volume: number[];
}

/**
 * Returns 24h activity metrics for every topic the caller is subscribed to,
 * keyed by topic id. A single grouped query covers all topics at once, so the
 * cost scales with messages in the window — not with the number of
 * subscriptions — and there is no per-row query (no N+1). Backed by the
 * Message `@@index([topicId, createdAt])`.
 */
export const subscriptionMetrics = new Elysia({ prefix: '/subscriptions' }).get(
    '/metrics',
    async ({ headers, query }) => {
        const { rows } = await resolveSubscriptions({ deviceId: query.deviceId, headers });

        const result: Record<string, SubscriptionMetrics> = {};

        if (rows.length === 0) {
            return result;
        }

        const now = new Date();
        const since24h = new Date(now.getTime() - duration.hours(24).as('ms'));
        const topicIds = Prisma.join(rows.map((subscription) => subscription.topicId));

        const hourlyRows = await prisma.$queryRaw<
            Array<{ count: bigint; hoursAgo: number; topicId: string }>
        >`
            SELECT
                "topicId",
                floor(extract(epoch FROM (${now} - "createdAt")) / 3600)::int AS "hoursAgo",
                count(*) AS count
            FROM "Message"
            WHERE "topicId" IN (${topicIds}) AND "createdAt" >= ${since24h}
            GROUP BY "topicId", "hoursAgo"
        `;

        for (const subscription of rows) {
            result[subscription.topicId] = {
                messageCount24h: 0,
                volume: Array<number>(24).fill(0),
            };
        }

        for (const row of hourlyRows) {
            const metrics = result[row.topicId];

            if (!metrics || row.hoursAgo < 0 || row.hoursAgo >= 24) {
                continue;
            }

            const count = Number(row.count);

            metrics.volume[23 - row.hoursAgo] = count;
            metrics.messageCount24h += count;
        }

        return result;
    },
    {
        query: t.Object({ deviceId: t.Optional(t.String({ minLength: 1 })) }),
    },
);
