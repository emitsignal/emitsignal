import { logger } from '#/lib/logger';

import type { EmailOptions, EmailProvider } from './provider';

export class LogProvider implements EmailProvider {
    async send(options: EmailOptions): Promise<void> {
        logger.info(
            {
                from: options.from,
                subject: options.subject,
                to: options.to,
            },
            'email sent (log provider)',
        );
    }
}
