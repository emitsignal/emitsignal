import { Email } from '#/lib/email';
import { logger } from '#/lib/logger';
import {
    createEmailWorker,
    createPurgeWorker,
    createPushWorker,
    createScheduleWorker,
    scheduleRetentionSweep,
} from '#/lib/queue';
import { runWorkers } from '#/lib/run-workers';
import { FileStorageService } from '#/lib/storage';
import { environment } from '#/schema/environment';

Email.init(environment);
FileStorageService.init(environment);

runWorkers([createEmailWorker(), createPushWorker(), createScheduleWorker(), createPurgeWorker()]);

await scheduleRetentionSweep();

logger.info('📧 email, 🔔 push, ⏱️ schedule, 🗑️ purge workers started');
