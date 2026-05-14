import { createTransport } from 'nodemailer';

import type { EmailOptions, EmailProvider } from './provider';

import { logger } from '../logger';

interface SmtpConfig {
    from: string;
    host: string;
    pass?: string;
    port: number;
    user?: string;
}

export class SmtpProvider implements EmailProvider {
    private transport: ReturnType<typeof createTransport>;

    constructor(config: SmtpConfig) {
        this.transport = createTransport({
            auth: config.user ? { pass: config.pass, user: config.user } : undefined,
            host: config.host,
            port: config.port,
            secure: config.port === 465,
        });
    }

    async send(options: EmailOptions): Promise<void> {
        const info = await this.transport.sendMail({
            from: options.from,
            html: options.html,
            subject: options.subject,
            text: options.text,
            to: options.to,
        });

        logger.info({ messageId: info.messageId, to: options.to }, 'email sent (smtp)');
    }
}
