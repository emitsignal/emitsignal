import Elysia from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { ensureMessageShareId } from '#/services/share';

export const shareMessage = new Elysia({ prefix: '/messages' }).post(
    '/:id/share',
    async ({ headers, params, status }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return status(401, { error: 'missing_token' });
        }

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
);
