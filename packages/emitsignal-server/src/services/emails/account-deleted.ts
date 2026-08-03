import { AccountDeletedEmail, render } from '@emitsignal/emails';
import { createElement } from 'react';

import { EmailService } from '#/lib/email-service';
import { logger } from '#/lib/logger';
import { environment } from '#/schema/environment';

interface DeletedUser {
    email: string;
    name?: null | string;
}

export async function sendAccountDeletedEmail(user: DeletedUser): Promise<void> {
    try {
        const html = await render(
            createElement(AccountDeletedEmail, {
                email: user.email,
                name: user.name ?? undefined,
            }),
        );

        await EmailService.send({
            from: environment.EMAIL_FROM,
            html,
            subject: 'Your EmitSignal account has been deleted',
            to: user.email,
        });
    } catch (error) {
        logger.error({ error }, 'failed to send account-deleted email');
    }
}
