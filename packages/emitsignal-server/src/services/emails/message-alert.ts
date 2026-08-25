import { MessageAlertEmail, render } from '@emitsignal/emails';
import { createElement } from 'react';

import { EmailService } from '#/lib/email-service';
import { logger } from '#/lib/logger';
import { environment } from '#/schema/environment';

interface MessageAlert {
    body: string;
    createdAt: Date;
    emailAddress: string;
    messageId: string;
    priority: number;
    tags: string[];
    title: string;
    topicName: string;
}

const SUBJECT_MAX_LENGTH = 120;

export async function sendMessageAlertEmail(alert: MessageAlert): Promise<void> {
    try {
        const html = await render(
            createElement(MessageAlertEmail, {
                body: alert.body,
                createdAt: alert.createdAt,
                messageUrl: `${environment.APP_URL}/app/inbox/${alert.messageId}`,
                priority: alert.priority,
                tags: alert.tags,
                title: alert.title,
                topicName: alert.topicName,
            }),
        );

        await EmailService.send({
            from: environment.EMAIL_FROM,
            html,
            subject: `[${alert.topicName}] ${subjectLine(alert)}`,
            to: alert.emailAddress,
        });
    } catch (error) {
        logger.error({ error, messageId: alert.messageId }, 'failed to send message-alert email');
    }
}

function subjectLine({ body, title }: MessageAlert): string {
    const source = title || body;

    if (source.length <= SUBJECT_MAX_LENGTH) {
        return source;
    }

    return `${source.slice(0, SUBJECT_MAX_LENGTH - 1).trimEnd()}…`;
}
