import * as Sentry from '@sentry/bun';

import { logger } from '../lib/logger';
import { redisConnection } from '../lib/queue/connection';
import { createPushWorker } from '../lib/queue/push/push-worker';

const worker = createPushWorker();

async function shutdown() {
    logger.info('shutting down push worker');

    await worker.close();
    await redisConnection.quit();

    await Sentry.close(2000);

    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info('🔔 push worker started');
