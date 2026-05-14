import type {
    ApiKeyCreatedEmailProps,
    MagicLinkEmailProps,
    MessageAlertEmailProps,
    WeeklyDigestProps,
} from '@emitsignal/emails';

import {
    ApiKeyCreatedEmail,
    MagicLinkEmail,
    MessageAlertEmail,
    render,
    WeeklyDigestEmail,
    WelcomeEmail,
} from '@emitsignal/emails';

import { environment } from '../schema/environment';
import { Email } from './email';
import { logger } from './logger';

export async function sendApiKeyCreated(
    email: string,
    props: ApiKeyCreatedEmailProps,
): Promise<void> {
    const html = await render(<ApiKeyCreatedEmail {...props} />);

    await Email.provider.send({
        from: environment.EMAIL_FROM,
        html,
        subject: 'New API Key Created — EmitSignal',
        to: email,
    });
}

export async function sendMagicLink(props: MagicLinkEmailProps): Promise<void> {
    const html = await render(<MagicLinkEmail {...props} />);

    await Email.provider.send({
        from: environment.EMAIL_FROM,
        html,
        subject: `Sign in to EmitSignal — code: ${props.code}`,
        to: props.email,
    });
}

export async function sendMessageAlert(
    email: string,
    props: MessageAlertEmailProps,
): Promise<void> {
    const html = await render(<MessageAlertEmail {...props} />);

    await Email.provider.send({
        from: environment.EMAIL_FROM,
        html,
        subject: `[${props.topicName}] ${props.title}`,
        to: email,
    });
}

export async function sendWeeklyDigest(email: string, props: WeeklyDigestProps): Promise<void> {
    const html = await render(<WeeklyDigestEmail {...props} />);

    await Email.provider.send({
        from: environment.EMAIL_FROM,
        html,
        subject: 'Your EmitSignal Weekly Digest',
        to: email,
    });
}

export async function sendWelcome(props: { email: string; name?: string }): Promise<void> {
    const html = await render(<WelcomeEmail {...props} />);

    await Email.provider.send({
        from: environment.EMAIL_FROM,
        html,
        subject: 'Welcome to EmitSignal',
        to: props.email,
    });
}

export async function trySendMagicLink(props: MagicLinkEmailProps): Promise<void> {
    try {
        await sendMagicLink(props);
    } catch (error) {
        logger.error({ email: props.email, err: error }, 'failed to send magic link email');
    }
}
