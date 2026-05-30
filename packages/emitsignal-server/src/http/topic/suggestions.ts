import Elysia, { t } from 'elysia';

import { authAwareBeforeHandle } from '../../http/plugins/rate-limit-plugin';
import { prisma } from '../../lib/prisma';
import { readAnonLimiter, readAuthLimiter } from '../../lib/rate-limit';

const CURATED = [
    {
        description: 'EmitSignal news & announcements',
        displayName: 'News',
        name: 'emitsignal/news',
    },
    {
        description: 'Discover trending topics & features',
        displayName: 'Discover',
        name: 'emitsignal/discover',
    },
];

const MAX_TOTAL = 5;

export const suggestions = new Elysia().get(
    '/suggestions',
    async ({ query }) => {
        const seen = new Set<string>();
        const result: { description: null | string; displayName: string; name: string }[] = [];

        // 1. Collect device subscription names for exclusion
        let subscribedNames: string[] = [];

        if (query.deviceId) {
            const deviceSubs = await prisma.subscription.findMany({
                select: { topic: { select: { name: true } } },
                where: { deviceId: query.deviceId },
            });
            subscribedNames = deviceSubs.map((subscription) => subscription.topic.name);
        }

        // 2. EmitSignal curated (1-2) — skip if already subscribed
        for (const curated of CURATED) {
            if (result.length >= MAX_TOTAL) break;
            if (subscribedNames.includes(curated.name)) continue;
            result.push(curated);
            seen.add(curated.name);
        }

        // 3. Trending (1-3) — exclude curated + device's own subscriptions
        const trendingExclude = [...seen, ...subscribedNames];

        const trending = await prisma.topic.findMany({
            include: { _count: { select: { subscriptions: true } } },
            orderBy: { subscriptions: { _count: 'desc' } },
            take: 3,
            where: {
                isPublic: true,
                name: { notIn: trendingExclude.length > 0 ? trendingExclude : undefined },
            },
        });

        for (const topic of trending) {
            if (result.length >= MAX_TOTAL) {
                break;
            }

            result.push({
                description: topic.description,
                displayName: topic.displayName,
                name: topic.name,
            });

            seen.add(topic.name);
        }

        return result;
    },
    {
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
        query: t.Object({ deviceId: t.Optional(t.String({ minLength: 1 })) }),
    },
);
