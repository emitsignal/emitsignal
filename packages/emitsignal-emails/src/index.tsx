export type { AccountDeletedEmailProps } from '../emails/account-deleted';

export { default as AccountDeletedEmail } from '../emails/account-deleted';
export type { ApiKeyCreatedProps as ApiKeyCreatedEmailProps } from '../emails/api-key-created';

export { default as ApiKeyCreatedEmail } from '../emails/api-key-created';
export type { MagicLinkEmailProps } from '../emails/magic-link';

export { default as MagicLinkEmail } from '../emails/magic-link';
export type { MessageAlertEmailProps } from '../emails/message-alert';

export { default as MessageAlertEmail } from '../emails/message-alert';
export type { DigestMessage, WeeklyDigestProps } from '../emails/weekly-digest';

export { default as WeeklyDigestEmail } from '../emails/weekly-digest';
export type { WelcomeEmailProps } from '../emails/welcome';

export { default as WelcomeEmail } from '../emails/welcome';
export { render } from '@react-email/render';
