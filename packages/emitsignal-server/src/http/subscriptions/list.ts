import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { parseSubscriptionSettings } from '#/utils/subscription-settings';

import { resolveSubscriptions } from './resolve';

export const listSubscriptions = new Elysia({ prefix: '/subscriptions' }).use(authPlugin).get(
    '/',
    async ({ query, userId }) => {
        const { rows } = await resolveSubscriptions({ deviceId: query.deviceId, userId });

        return rows.map((subscription) => ({
            createdAt: subscription.createdAt.getTime(),
            id: subscription.id,
            pushEnabled: subscription.pushEnabled,
            settings: parseSubscriptionSettings(subscription.settings),
            topic: {
                accessMode: subscription.topic.accessMode,
                description: subscription.topic.description,
                displayName: subscription.topic.displayName,
                id: subscription.topic.id,
                isOwner: Boolean(userId) && subscription.topic.ownerId === userId,
                name: subscription.topic.name,
                ownerId: subscription.topic.ownerId,
            },
        }));
    },
    {
        authOptional: true,
        query: t.Object({ deviceId: t.Optional(t.String({ minLength: 1 })) }),
    },
);
