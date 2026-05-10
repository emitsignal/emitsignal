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
} from "react-email";

import { LogoHeader } from "./components/logo-header";
import tailwindConfig from "./tailwind.config";

interface MessageAlertEmailProps {
    body: string;
    createdAt: Date;
    messageUrl: string;
    priority: number;
    tags: string[];
    title: string;
    topicName: string;
}

const priorityColors: Record<number, string> = {
    1: "#818cf8",
    2: "#a78bfa",
    3: "#c4b5fd",
    4: "#fbbf24",
    5: "#f87171",
};

const priorityLabels: Record<number, string> = {
    1: "Low",
    2: "Normal",
    3: "Elevated",
    4: "High",
    5: "Critical",
};

export default function MessageAlertEmail({
    body,
    createdAt,
    messageUrl,
    priority,
    tags,
    title,
    topicName,
}: MessageAlertEmailProps) {
    const pColor = priorityColors[priority] ?? priorityColors[3];
    const pLabel = priorityLabels[priority] ?? "Normal";

    return (
        <Html lang="en">
            <Tailwind config={tailwindConfig}>
                <Head />
                <Preview>
                    [{topicName}] {title} — Priority {String(priority)}
                </Preview>
                <Body className="bg-es-bg py-10 font-sans">
                    <Container className="mx-auto max-w-xl px-5">
                        <LogoHeader />

                        <Section className="overflow-hidden rounded-lg border border-solid border-es-bgLine bg-es-bgElev">
                            <div
                                style={{
                                    backgroundColor: pColor,
                                    height: "3px",
                                    width: "100%",
                                }}
                            />
                            <Section className="p-5">
                                <Row className="mb-3">
                                    <Column>
                                        <Text className="m-0 font-mono text-xs uppercase tracking-wider text-es-fgDim">
                                            {topicName}
                                        </Text>
                                    </Column>
                                    <Column className="text-right">
                                        <Text className="m-0 font-mono text-xs text-es-fgDim">
                                            {relativeTime(createdAt.getTime())}
                                        </Text>
                                    </Column>
                                </Row>

                                <Row className="mb-3">
                                    <Column style={{ width: "10px" }}>
                                        <div
                                            style={{
                                                backgroundColor: pColor,
                                                borderRadius: "9999px",
                                                height: "8px",
                                                marginRight: "6px",
                                                marginTop: "6px",
                                                width: "8px",
                                            }}
                                        />
                                    </Column>
                                    <Column>
                                        <Text className="m-0 text-xs font-bold text-es-fgMuted">
                                            {pLabel}
                                        </Text>
                                    </Column>
                                </Row>

                                <Heading className="mb-2 text-lg font-bold text-es-fg">
                                    {title}
                                </Heading>
                                <Text className="mb-4 text-sm leading-6 text-es-fgMuted">
                                    {body}
                                </Text>

                                {tags.length > 0 && (
                                    <Row className="mb-4">
                                        {tags.map((tag) => (
                                            <Column
                                                key={tag}
                                                style={{
                                                    paddingRight: "6px",
                                                }}
                                            >
                                                <Text className="m-0 inline-block rounded-full border border-solid border-es-bgLine bg-es-bgChip px-2 py-1 font-mono text-[10px] text-es-fgMuted">
                                                    {tag}
                                                </Text>
                                            </Column>
                                        ))}
                                    </Row>
                                )}

                                <Button
                                    className="box-border block rounded-lg bg-es-violet px-5 py-2.5 text-center text-sm font-bold text-es-bg no-underline"
                                    href={messageUrl}
                                >
                                    Open Message
                                </Button>
                            </Section>
                        </Section>

                        <Text className="mt-6 text-xs text-es-fgFaint">
                            You received this because you are subscribed to{" "}
                            <strong className="text-es-fgMuted">{topicName}</strong>.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}

function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "now";
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    return `${day}d`;
}

MessageAlertEmail.PreviewProps = {
    body: "The production deployment pipeline failed during the build step. Check the logs for details.",
    createdAt: new Date(Date.now() - 5 * 60000),
    messageUrl: "https://emitsignal.com/messages/msg_123",
    priority: 4,
    tags: ["deploy", "production", "ci"],
    title: "Deployment failed on main",
    topicName: "alerts",
} satisfies MessageAlertEmailProps;
