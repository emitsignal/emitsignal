import Elysia from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import { logger } from '#/lib/logger';
import { purgeQueue } from '#/lib/queue';
import { captureTraceContext } from '#/lib/trace-context';

// Deletes every signal the authenticated user is responsible for — messages in
// topics they own plus messages they sent into others' topics — keeping channels
// intact. The heavy deletion (and attachment file cleanup) runs asynchronously.

export const purgeSignals = new Elysia().delete('/me/signals', async ({ headers, status }) => {
    const userId = await resolveUserId({ headers });

    if (!userId) {
        return status(401, { error: 'missing_token' });
    }

    logger.info({ userId }, 'signal purge requested');

    await purgeQueue.add('purge-signals', {
        kind: 'signals',
        traceContext: captureTraceContext(),
        userId,
    });

    return status(202, { status: 'queued' });
});
