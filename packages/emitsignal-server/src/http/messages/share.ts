import Elysia from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import { ensureMessageShareId } from '#/services/share';

export const shareMessage = new Elysia({ prefix: '/messages' }).use(authPlugin).post(
    '/:id/share',
    async ({ params, status, userId }) => {
        const result = await ensureMessageShareId(params.id, userId);

        if (result.kind === 'not_found') {
            return status(404, { error: 'message_not_found' });
        }

        if (result.kind === 'topic_not_public') {
            return status(409, {
                accessMode: result.accessMode,
                error: 'topic_not_public',
                topicName: result.topicName,
            });
        }

        return { shareId: result.shareId };
    },
    { authRequired: true },
);
