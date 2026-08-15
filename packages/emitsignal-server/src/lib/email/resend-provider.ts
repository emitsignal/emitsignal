import { Resend } from 'resend';

import { logger } from '#/lib/logger';

import type { EmailOptions, EmailProvider } from './provider';

export class ResendProvider implements EmailProvider {
    private client: Resend;

    constructor(apiKey: string) {
        this.client = new Resend(apiKey);
    }

    async send(options: EmailOptions): Promise<void> {
        const { data, error } = await this.client.emails.send({
            from: options.from ?? '',
            html: options.html,
            subject: options.subject,
            text: options.text,
            to: options.to,
        });

        if (error) {
            logger.error({ error }, 'resend email failed');

            throw new Error(`Resend email failed: ${error.message}`);
        }

        logger.info({ resendId: data?.id }, 'email sent (resend)');
    }
}
