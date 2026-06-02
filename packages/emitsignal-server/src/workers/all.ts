import { Email } from '../lib/email';
import { logger } from '../lib/logger';
import { createEmailWorker, createPushWorker, createScheduleWorker } from '../lib/queue';
import { runWorkers } from '../lib/run-workers';
import { environment } from '../schema/environment';

Email.init(environment);

runWorkers([createEmailWorker(), createPushWorker(), createScheduleWorker()]);

logger.info('📧 email, 🔔 push, ⏱️ schedule workers started');
