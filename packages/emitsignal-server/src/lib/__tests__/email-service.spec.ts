import { describe, expect, it, mock } from 'bun:test';

import { EmailService } from '../email-service';

describe('EmailService', () => {
    it('init stores the queue for later use', async () => {
        const add = mock(() => Promise.resolve());
        const queue = { add } as any;

        EmailService.init(queue);

        await EmailService.send({
            from: 'from@test.com',
            html: '<p>html</p>',
            subject: 'Test',
            to: 'to@test.com',
        });

        expect(add).toHaveBeenCalledTimes(1);
    });

    it('send calls queue.add with correct args', async () => {
        const add = mock(() => Promise.resolve());
        const queue = { add } as any;

        EmailService.init(queue);

        const options = {
            from: 'from@test.com',
            html: '<p>Hello</p>',
            subject: 'Welcome',
            to: 'user@test.com',
        };

        await EmailService.send(options);

        expect(add).toHaveBeenCalledWith('send-email', options);
    });

    it('send passes through all email options', async () => {
        const add = mock(() => Promise.resolve());
        const queue = { add } as any;

        EmailService.init(queue);

        const options = {
            cc: 'cc@test.com',
            from: 'noreply@test.com',
            html: '<p>Body</p>',
            subject: 'Subject',
            to: 'to@test.com',
        };

        await EmailService.send(options);

        const call = add.mock.calls[0] as unknown as [string, typeof options];
        expect(call[0]).toBe('send-email');
        expect(call[1].from).toBe('noreply@test.com');
        expect(call[1].html).toBe('<p>Body</p>');
        expect(call[1].subject).toBe('Subject');
        expect(call[1].to).toBe('to@test.com');
    });
});
