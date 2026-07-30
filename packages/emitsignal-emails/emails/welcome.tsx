import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Tailwind,
    Text,
} from 'react-email';

import { LogoHeader } from './components/logo-header';
import tailwindConfig from './tailwind.config';

export interface WelcomeEmailProps {
    email: string;
    name?: string;
}

export default function WelcomeEmail({ email, name }: WelcomeEmailProps) {
    const greeting = name ? `Welcome, ${name}` : 'Welcome aboard';

    return (
        <Html lang="en">
            <Tailwind config={tailwindConfig}>
                <Head>
                    <meta content="dark" name="color-scheme" />
                    <meta content="dark" name="supported-color-schemes" />
                </Head>
                <Preview>Welcome to EmitSignal — your inbox for alerts</Preview>
                <Body className="bg-es-bg py-10 font-sans">
                    <Container className="mx-auto max-w-xl px-5">
                        <LogoHeader />
                        <Heading className="mb-4 text-2xl font-bold text-es-fg">{greeting}</Heading>
                        <Text className="mb-6 text-base leading-7 text-es-fgMuted">
                            Thanks for joining EmitSignal. You signed up with{' '}
                            <strong className="text-es-fg">{email}</strong>. Here&apos;s what you
                            can do next:
                        </Text>

                        <Section className="mb-6 rounded-lg border border-solid border-es-bgLine bg-es-bgElev p-5">
                            <Text className="mb-2 text-xs uppercase tracking-wider text-es-fgDim">
                                Quick start
                            </Text>
                            <Text className="mb-3 text-base text-es-fg">
                                <strong className="text-es-violet">1.</strong> Subscribe to topics
                                that matter to you
                            </Text>
                            <Text className="mb-3 text-base text-es-fg">
                                <strong className="text-es-violet">2.</strong> Set push
                                notifications for urgent alerts
                            </Text>
                            <Text className="mb-3 text-base text-es-fg">
                                <strong className="text-es-violet">3.</strong> Publish messages via
                                API or the dashboard
                            </Text>
                        </Section>

                        <Button
                            className="mb-6 box-border block rounded-lg bg-es-violet px-6 py-3 text-center text-base font-bold text-es-bg no-underline"
                            href="https://emitsignal.com"
                        >
                            Open EmitSignal
                        </Button>

                        <Text className="text-sm text-es-fgFaint">
                            Need help? Reach out at{' '}
                            <a
                                className="text-es-violet no-underline"
                                href="mailto:support@emitsignal.com"
                            >
                                support@emitsignal.com
                            </a>
                            .
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}

WelcomeEmail.PreviewProps = {
    email: 'dev@example.com',
    name: 'Miguel',
} satisfies WelcomeEmailProps;
