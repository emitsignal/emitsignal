import { logger } from '#/lib/logger';
import { createScheduleWorker } from '#/lib/queue';
import { runWorkers } from '#/lib/run-workers';

runWorkers([createScheduleWorker()]);

logger.info('⏱️ schedule worker started');
