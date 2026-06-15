import Elysia from 'elysia';

import { authAwareBeforeHandle } from '../../http/plugins/rate-limit-plugin';
import { duration } from '../../lib/duration';
import { prisma } from '../../lib/prisma';
import { readAnonLimiter, readAuthLimiter } from '../../lib/rate-limit';

export const topicMetrics = new Elysia().get(
    '/topics/:name/metrics',
    async ({ params, status }) => {
        const topic = await prisma.topic.findUnique({
            select: {
                _count: { select: { subscriptions: true } },
                id: true,
            },
            where: { name: params.name },
        });

        if (!topic) {
            return status(404, { error: 'topic_not_found' });
        }

        const now = new Date();
        const since24h = new Date(now.getTime() - duration.hours(24).as('ms'));

        const [messageCount24h, p5Count24h, hourlyRows] = await Promise.all([
            prisma.message.count({
                where: { createdAt: { gte: since24h }, topicId: topic.id },
            }),
            prisma.message.count({
                where: { createdAt: { gte: since24h }, priority: 5, topicId: topic.id },
            }),
            prisma.$queryRaw<Array<{ count: bigint; hoursAgo: number }>>`
                SELECT
                    floor(extract(epoch FROM (${now} - "createdAt")) / 3600)::int AS "hoursAgo",
                    count(*) AS count
                FROM "Message"
                WHERE "topicId" = ${topic.id} AND "createdAt" >= ${since24h}
                GROUP BY "hoursAgo"
            `,
        ]);

        const volume = Array<number>(24).fill(0);

        for (const row of hourlyRows) {
            if (row.hoursAgo >= 0 && row.hoursAgo < 24) {
                volume[23 - row.hoursAgo] = Number(row.count);
            }
        }

        return {
            messageCount24h,
            p5Count24h,
            subscriberCount: topic._count.subscriptions,
            volume,
        };
    },
    {
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
    },
);
