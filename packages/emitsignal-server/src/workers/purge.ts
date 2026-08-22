import { logger } from '#/lib/logger';
import { scheduleCounterFlush, scheduleRetentionSweep } from '#/lib/queue';
import { createPurgeWorker } from '#/lib/queue/purge/purge-worker';
import { runWorkers } from '#/lib/run-workers';
import { FileStorageService } from '#/lib/storage';
import { environment } from '#/schema/environment';

FileStorageService.init(environment);

runWorkers([createPurgeWorker()]);

await scheduleRetentionSweep();
await scheduleCounterFlush();

logger.info('🗑️ purge worker started');
