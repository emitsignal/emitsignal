import Elysia from 'elysia';

import { resolveUserId } from '#/http/auth/resolve-user-id';

// Two keys rather than one `authRequired: boolean`: a macro cannot narrow on its own
// argument, so a separate key per return type is the only way to get `string` for a
// required route and `string | null` for an optional one. A literal `false` is worse
// than useless here: Elysia still runs the macro, but drops `userId` from the types.
export const authPlugin = new Elysia({ name: 'auth' }).macro({
    authOptional: {
        resolve: async ({ headers }) => ({
            userId: await resolveUserId({ headers }),
        }),
    },
    authRequired: {
        resolve: async ({ headers, status }) => {
            const userId = await resolveUserId({ headers });

            if (!userId) {
                return status(401, { error: 'missing_token' });
            }

            return { userId };
        },
    },
});
