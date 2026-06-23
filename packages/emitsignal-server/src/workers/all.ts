import { Email } from '../lib/email';
import { logger } from '../lib/logger';
import {
    createEmailWorker,
    createPurgeWorker,
    createPushWorker,
    createScheduleWorker,
} from '../lib/queue';
import { runWorkers } from '../lib/run-workers';
import { FileStorageService } from '../lib/storage';
import { environment } from '../schema/environment';

Email.init(environment);
FileStorageService.init(environment);

runWorkers([createEmailWorker(), createPushWorker(), createScheduleWorker(), createPurgeWorker()]);

logger.info('📧 email, 🔔 push, ⏱️ schedule, 🗑️ purge workers started');
