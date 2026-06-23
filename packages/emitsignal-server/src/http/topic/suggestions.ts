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

export const suggestions = new Elysia().get(
    '/suggestions',
    async ({ query }) => {
        // Collect device subscription names so we don't re-suggest curated
        // channels the device is already subscribed to.
        let subscribedNames: string[] = [];

        if (query.deviceId) {
            const deviceSubs = await prisma.subscription.findMany({
                select: { topic: { select: { name: true } } },
                where: { deviceId: query.deviceId },
            });
            subscribedNames = deviceSubs.map((subscription) => subscription.topic.name);
        }

        return CURATED.filter((curated) => !subscribedNames.includes(curated.name));
    },
    {
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
        query: t.Object({ deviceId: t.Optional(t.String({ minLength: 1 })) }),
    },
);
