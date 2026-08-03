import { ApiKeyCreatedEmail, render } from '@emitsignal/emails';
import { createElement } from 'react';

import { EmailService } from '#/lib/email-service';
import { logger } from '#/lib/logger';
import { prisma } from '#/lib/prisma';
import { environment } from '#/schema/environment';

interface CreatedApiKey {
    createdAt: Date | string;
    name?: null | string;
    prefix?: null | string;
    referenceId: string;
    start?: null | string;
}

export async function sendApiKeyCreatedEmail(returned: unknown): Promise<void> {
    if (!isCreatedApiKey(returned)) {
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            select: { email: true },
            where: { id: returned.referenceId },
        });

        if (!user?.email) {
            return;
        }

        const html = await render(
            createElement(ApiKeyCreatedEmail, {
                createdAt: new Date(returned.createdAt),
                label: returned.name ?? 'Unnamed key',
                prefix: returned.start ?? returned.prefix ?? 'es_',
                revokeUrl: `${environment.APP_URL}/app/keys`,
            }),
        );

        await EmailService.send({
            from: environment.EMAIL_FROM,
            html,
            subject: 'New API key created',
            to: user.email,
        });
    } catch (error) {
        logger.error(
            { error, userId: returned.referenceId },
            'failed to send api-key-created email',
        );
    }
}

function isCreatedApiKey(value: unknown): value is CreatedApiKey {
    return (
        typeof value === 'object' &&
        value !== null &&
        'referenceId' in value &&
        typeof (value as Record<string, unknown>).referenceId === 'string'
    );
}
