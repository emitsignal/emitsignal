import { logger } from '../lib/logger';
import { createPushWorker } from '../lib/queue/push/push-worker';
import { runWorkers } from '../lib/run-workers';

runWorkers([createPushWorker()]);

logger.info('🔔 push worker started');
