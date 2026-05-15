import type { Queue } from 'bullmq';

import type { EmailOptions } from './email/provider';

export class EmailService {
    private static queue: Queue<EmailOptions>;

    static init(queue: Queue<EmailOptions>): void {
        EmailService.queue = queue;
    }

    static async send(options: EmailOptions): Promise<void> {
        await EmailService.queue.add('send-email', options);
    }
}
