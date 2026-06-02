import * as Sentry from '@sentry/bun';

import { Email } from '../lib/email';
import { logger } from '../lib/logger';
import { redisConnection } from '../lib/queue/connection';
import { createEmailWorker } from '../lib/queue/email/email-worker';
import { environment } from '../schema/environment';

Email.init(environment);

const worker = createEmailWorker();

async function shutdown() {
    logger.info('shutting down email worker');

    await worker.close();
    await redisConnection.quit();

    await Sentry.close(2000);

    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info('📧 email worker started');
