import { describe, expect, it, mock } from 'bun:test';

import { EmailService } from './email-service';

describe('EmailService', () => {
    it('init stores the queue for later use', async () => {
        const add = mock(() => Promise.resolve());
        const queue = { add };

        EmailService.init(queue as unknown as Parameters<typeof EmailService.init>[0]);

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
        const queue = { add };

        EmailService.init(queue as unknown as Parameters<typeof EmailService.init>[0]);

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
        const queue = { add };

        EmailService.init(queue as unknown as Parameters<typeof EmailService.init>[0]);

        const options = {
            cc: 'cc@test.com',
            from: 'noreply@test.com',
            html: '<p>Body</p>',
            subject: 'Subject',
            to: 'to@test.com',
        };

        await EmailService.send(options);

        const callArgs = add.mock.calls[0] as unknown as [string, typeof options];
        expect(callArgs[0]).toBe('send-email');
        expect(callArgs[1].from).toBe('noreply@test.com');
        expect(callArgs[1].html).toBe('<p>Body</p>');
        expect(callArgs[1].subject).toBe('Subject');
        expect(callArgs[1].to).toBe('to@test.com');
    });
});
