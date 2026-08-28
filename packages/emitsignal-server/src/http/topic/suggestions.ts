import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { authAwareBeforeHandle } from '#/http/plugins/rate-limit-plugin';
import { resolveSubscriptions } from '#/http/subscriptions/resolve';
import { readAnonLimiter, readAuthLimiter } from '#/lib/rate-limit';

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

export const suggestions = new Elysia().use(authPlugin).get(
    '/suggestions',
    async ({ query, userId }) => {
        // Resolve subscriptions the same way the rest of the subscriptions
        // surface does: by account when the caller is signed in, by device when
        // anonymous. Filtering on deviceId alone re-suggested curated channels
        // to signed-in users on a second device or a fresh install.
        const { rows } = await resolveSubscriptions({ deviceId: query.deviceId, userId });

        const subscribedNames = rows.map((subscription) => subscription.topic.name);

        return CURATED.filter((curated) => !subscribedNames.includes(curated.name));
    },
    {
        authOptional: true,
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
        query: t.Object({ deviceId: t.Optional(t.String({ minLength: 1 })) }),
    },
);
