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

        const since24h = new Date(Date.now() - duration.hours(24).as('ms'));

        const messages = await prisma.message.findMany({
            select: { createdAt: true, priority: true },
            where: { createdAt: { gte: since24h }, topicId: topic.id },
        });

        const p5Count24h = messages.filter(({ priority }) => priority === 5).length;

        const volume = Array<number>(24).fill(0);
        const now = Date.now();

        for (const message of messages) {
            const hoursAgo = Math.floor((now - message.createdAt.getTime()) / (60 * 60 * 1000));

            if (hoursAgo < 24) {
                volume[23 - hoursAgo]++;
            }
        }

        return {
            messageCount24h: messages.length,
            p5Count24h,
            subscriberCount: topic._count.subscriptions,
            volume,
        };
    },
    {
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
    },
);
