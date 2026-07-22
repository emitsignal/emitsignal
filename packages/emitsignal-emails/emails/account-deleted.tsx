import { Body, Container, Head, Heading, Html, Preview, Tailwind, Text } from 'react-email';

import { LogoHeader } from './components/logo-header';
import tailwindConfig from './tailwind.config';

export interface AccountDeletedEmailProps {
    email: string;
    name?: string;
}

export default function AccountDeletedEmail({ email, name }: AccountDeletedEmailProps) {
    return (
        <Html lang="en">
            <Tailwind config={tailwindConfig}>
                <Head />
                <Preview>Your EmitSignal account has been deleted</Preview>
                <Body className="bg-es-bg py-10 font-sans">
                    <Container className="mx-auto max-w-xl px-5">
                        <LogoHeader />
                        <Heading className="mb-4 text-2xl font-bold text-es-fg">
                            Account deleted
                        </Heading>
                        <Text className="mb-6 text-base leading-7 text-es-fgMuted">
                            {name ? `Hi ${name}, y` : 'Y'}our EmitSignal account (
                            <strong className="text-es-fg">{email}</strong>) and all associated data
                            — topics, messages, subscriptions, and API keys — have been permanently
                            deleted.
                        </Text>

                        <Text className="mb-6 text-sm text-es-fgMuted">
                            If you didn&apos;t request this, or believe this happened in error,
                            contact us right away at{' '}
                            <a
                                className="text-es-violet no-underline"
                                href="mailto:support@emitsignal.com"
                            >
                                support@emitsignal.com
                            </a>
                            .
                        </Text>

                        <Text className="text-sm text-es-fgFaint">
                            You&apos;re welcome back anytime — creating a new account will start
                            fresh with no data carried over.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}

AccountDeletedEmail.PreviewProps = {
    email: 'dev@example.com',
    name: 'Miguel',
} satisfies AccountDeletedEmailProps;
