import * as Sentry from '@sentry/bun';

import { logger } from '../lib/logger';
import { createScheduleWorker } from '../lib/queue';
import { redisConnection } from '../lib/queue/connection';

const worker = createScheduleWorker();

async function shutdown() {
    logger.info('shutting down push worker');

    await worker.close();
    await redisConnection.quit();

    await Sentry.close(2000);

    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info('⏱️ schedule worker started');
