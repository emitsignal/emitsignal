import { Email } from '#/lib/email';
import { logger } from '#/lib/logger';
import { createEmailWorker } from '#/lib/queue/email/email-worker';
import { runWorkers } from '#/lib/run-workers';
import { environment } from '#/schema/environment';

Email.init(environment);

runWorkers([createEmailWorker()]);

logger.info('📧 email worker started');
