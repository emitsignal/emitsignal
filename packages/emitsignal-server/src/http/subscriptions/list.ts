import Elysia, { t } from 'elysia';

import { resolveSubscriptions } from './resolve';

export const listSubscriptions = new Elysia({ prefix: '/subscriptions' }).get(
    '/',
    async ({ headers, query }) => {
        const { rows } = await resolveSubscriptions({ deviceId: query.deviceId, headers });

        return rows.map((subscription) => ({
            createdAt: subscription.createdAt.getTime(),
            id: subscription.id,
            pushEnabled: subscription.pushEnabled,
            topic: {
                description: subscription.topic.description,
                displayName: subscription.topic.displayName,
                id: subscription.topic.id,
                isPublic: subscription.topic.isPublic,
                name: subscription.topic.name,
            },
        }));
    },
    {
        query: t.Object({ deviceId: t.Optional(t.String({ minLength: 1 })) }),
    },
);
