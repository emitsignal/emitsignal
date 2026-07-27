import { priorityHex, relativeTime } from '@emitsignal/shared';
import {
    Body,
    Button,
    Column,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Row,
    Section,
    Tailwind,
    Text,
} from 'react-email';

import { LogoHeader } from './components/logo-header';
import tailwindConfig from './tailwind.config';

export interface DigestMessage {
    createdAt: Date;
    id: string;
    priority: number;
    title: string;
    topicName: string;
}

export interface WeeklyDigestProps {
    inboxUrl: string;
    messages: DigestMessage[];
    weekStart: Date;
}

export default function WeeklyDigestEmail({ inboxUrl, messages, weekStart }: WeeklyDigestProps) {
    const grouped = messages.reduce<Record<string, DigestMessage[]>>((acc, msg) => {
        const list = acc[msg.topicName] ?? [];
        list.push(msg);
        acc[msg.topicName] = list;
        return acc;
    }, {});

    const topicNames = Object.keys(grouped).sort();
    const totalMessages = messages.length;

    return (
        <Html lang="en">
            <Tailwind config={tailwindConfig}>
                <Head>
                    <meta name="color-scheme" content="dark" />
                    <meta name="supported-color-schemes" content="dark" />
                </Head>
                <Preview>
                    Weekly Digest — {String(totalMessages)} message
                    {totalMessages === 1 ? '' : 's'} from {String(topicNames.length)} channel
                    {topicNames.length === 1 ? '' : 's'}
                </Preview>
                <Body className="bg-es-bg py-10 font-sans">
                    <Container className="mx-auto max-w-xl px-5">
                        <LogoHeader />
                        <Heading className="mb-2 text-2xl font-bold text-es-fg">
                            Weekly Digest
                        </Heading>
                        <Text className="mb-6 font-mono text-sm text-es-fgDim">
                            Week of{' '}
                            {weekStart.toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </Text>

                        {topicNames.map((topic) => (
                            <Section
                                className="mb-6 rounded-lg border border-solid border-es-bgLine bg-es-bgElev p-5"
                                key={topic}
                            >
                                <Row className="mb-3">
                                    <Column>
                                        <Text className="m-0 font-mono text-xs uppercase tracking-wider text-es-fgDim">
                                            {topic}
                                        </Text>
                                    </Column>
                                    <Column className="text-right">
                                        <Text className="m-0 font-mono text-xs text-es-fgFaint">
                                            {grouped[topic].length} message
                                            {grouped[topic].length === 1 ? '' : 's'}
                                        </Text>
                                    </Column>
                                </Row>

                                {grouped[topic].map((msg) => (
                                    <Row className="mb-2" key={msg.id}>
                                        <Column style={{ width: '12px' }}>
                                            <div
                                                style={{
                                                    backgroundColor: priorityHex(msg.priority),
                                                    borderRadius: '9999px',
                                                    height: '6px',
                                                    marginRight: '8px',
                                                    marginTop: '7px',
                                                    width: '6px',
                                                }}
                                            />
                                        </Column>
                                        <Column>
                                            <Text className="m-0 text-sm text-es-fg">
                                                {msg.title}
                                            </Text>
                                        </Column>
                                        <Column className="text-right" style={{ width: '40px' }}>
                                            <Text className="m-0 font-mono text-xs text-es-fgFaint">
                                                {relativeTime(msg.createdAt.getTime())}
                                            </Text>
                                        </Column>
                                    </Row>
                                ))}
                            </Section>
                        ))}

                        {totalMessages === 0 && (
                            <Section className="mb-6 rounded-lg border border-solid border-es-bgLine bg-es-bgElev p-5 text-center">
                                <Text className="text-sm text-es-fgMuted">
                                    No new messages this week.
                                </Text>
                            </Section>
                        )}

                        <Button
                            className="box-border block rounded-lg bg-es-violet px-6 py-3 text-center text-base font-bold text-es-bg no-underline"
                            href={inboxUrl}
                        >
                            View Inbox
                        </Button>

                        <Text className="mt-6 text-xs text-es-fgFaint">
                            You can manage your subscriptions in the app.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}

WeeklyDigestEmail.PreviewProps = {
    inboxUrl: 'https://emitsignal.com',
    messages: [
        {
            createdAt: new Date(Date.now() - 2 * 3600000),
            id: 'msg_1',
            priority: 5,
            title: 'Database connection timeout',
            topicName: 'alerts',
        },
        {
            createdAt: new Date(Date.now() - 5 * 3600000),
            id: 'msg_2',
            priority: 3,
            title: 'CI pipeline completed',
            topicName: 'ci',
        },
        {
            createdAt: new Date(Date.now() - 24 * 3600000),
            id: 'msg_3',
            priority: 4,
            title: 'Deployment failed on staging',
            topicName: 'deploy',
        },
    ],
    weekStart: new Date(),
} satisfies WeeklyDigestProps;
