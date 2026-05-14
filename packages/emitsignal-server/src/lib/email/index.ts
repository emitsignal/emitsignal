import type { Environment } from '../../schema/environment';
import type { EmailProvider } from './provider';

import { LogProvider } from './log-provider';
import { ResendProvider } from './resend-provider';
import { SmtpProvider } from './smtp-provider';

export class Email {
    static get provider(): EmailProvider {
        if (!Email.instance) {
            throw new Error('Email provider not initialized — call Email.init() at startup');
        }

        return Email.instance;
    }

    private static instance: EmailProvider | null = null;

    static init(env: Environment): EmailProvider {
        if (Email.instance) return Email.instance;

        switch (env.EMAIL_PROVIDER) {
            case 'resend': {
                if (!env.RESEND_API_KEY) {
                    throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
                }
                Email.instance = new ResendProvider(env.RESEND_API_KEY);
                break;
            }
            case 'smtp':
                Email.instance = new SmtpProvider({
                    from: env.EMAIL_FROM,
                    host: env.SMTP_HOST,
                    pass: env.SMTP_PASS,
                    port: env.SMTP_PORT,
                    user: env.SMTP_USER,
                });
                break;
            default:
                Email.instance = new LogProvider();
        }

        return Email.instance;
    }
}

export type { EmailProvider };
