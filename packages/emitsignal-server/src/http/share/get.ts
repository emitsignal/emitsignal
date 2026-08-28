import { isValidShareId } from '@emitsignal/shared/share';
import Elysia from 'elysia';

import { authAwareBeforeHandle } from '#/http/plugins/rate-limit-plugin';
import { readAnonLimiter, readAuthLimiter } from '#/lib/rate-limit';
import { getSharedMessage } from '#/services/share';

export const getShare = new Elysia().get(
    '/share/:shareId',
    async ({ params, status }) => {
        if (!isValidShareId(params.shareId)) {
            return status(404, { error: 'share_not_found' });
        }

        const shared = await getSharedMessage(params.shareId);

        if (!shared) {
            return status(404, { error: 'share_not_found' });
        }

        return shared;
    },
    {
        beforeHandle: authAwareBeforeHandle(readAnonLimiter, readAuthLimiter),
    },
);
