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
} from "react-email";

import { LogoHeader } from "./components/logo-header";
import tailwindConfig from "./tailwind.config";

interface ApiKeyCreatedProps {
    createdAt: Date;
    label: string;
    prefix: string;
    revokeUrl: string;
}

export default function ApiKeyCreatedEmail({
    createdAt,
    label,
    prefix,
    revokeUrl,
}: ApiKeyCreatedProps) {
    return (
        <Html lang="en">
            <Tailwind config={tailwindConfig}>
                <Head />
                <Preview>Security alert: New API key created</Preview>
                <Body className="bg-es-bg py-10 font-sans">
                    <Container className="mx-auto max-w-xl px-5">
                        <LogoHeader />

                        <div
                            style={{
                                backgroundColor: "#fbbf24",
                                height: "3px",
                                marginBottom: "24px",
                                width: "100%",
                            }}
                        />

                        <Heading className="mb-4 text-2xl font-bold text-es-fg">
                            New API Key Created
                        </Heading>
                        <Text className="mb-6 text-base leading-7 text-es-fgMuted">
                            A new API key was added to your EmitSignal account. If this was you, no
                            action is needed.
                        </Text>

                        <Section className="mb-6 rounded-lg border border-solid border-es-bgLine bg-es-bgElev p-5">
                            <Text className="mb-2 text-xs uppercase tracking-wider text-es-fgDim">
                                Key details
                            </Text>
                            <Text className="mb-1 text-sm text-es-fg">
                                <strong>Label:</strong> {label}
                            </Text>
                            <Text className="mb-1 font-mono text-sm text-es-fg">
                                <strong>Prefix:</strong> {prefix}
                            </Text>
                            <Text className="m-0 text-sm text-es-fgMuted">
                                <strong>Created:</strong>{" "}
                                {createdAt.toLocaleString("en-US", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })}
                            </Text>
                        </Section>

                        <Text className="mb-6 text-sm text-es-fgMuted">
                            If you did not create this key, someone may have access to your account.
                            Revoke it immediately.
                        </Text>

                        <Button
                            className="mb-6 box-border block rounded-lg bg-es-amber px-6 py-3 text-center text-base font-bold text-es-bg no-underline"
                            href={revokeUrl}
                        >
                            Revoke Key
                        </Button>

                        <Text className="text-sm text-es-fgFaint">
                            Tips:
                            <br />
                            • Store keys in a secrets manager, never in code.
                            <br />
                            • Rotate keys every 90 days.
                            <br />• Revoke unused keys promptly.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}

ApiKeyCreatedEmail.PreviewProps = {
    createdAt: new Date(),
    label: "Production Deploy",
    prefix: "es_live_••••••••",
    revokeUrl: "https://emitsignal.com/settings/api-keys",
} satisfies ApiKeyCreatedProps;
