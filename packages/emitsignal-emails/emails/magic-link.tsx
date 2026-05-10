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

interface MagicLinkEmailProps {
    code: string;
    email: string;
    expiresAt: Date;
    magicLinkUrl: string;
}

export default function MagicLinkEmail({
    code,
    email,
    expiresAt,
    magicLinkUrl,
}: MagicLinkEmailProps) {
    const expiresInMinutes = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000));

    return (
        <Html lang="en">
            <Tailwind config={tailwindConfig}>
                <Head />
                <Preview>Your Emit Signal sign-in code: {code}</Preview>
                <Body className="bg-es-bg py-10 font-sans">
                    <Container className="mx-auto max-w-xl px-5">
                        <LogoHeader />
                        <Heading className="mb-4 text-2xl font-bold text-es-fg">
                            Sign in to Emit Signal
                        </Heading>
                        <Text className="mb-6 text-base text-es-fgMuted">
                            You requested a magic link to sign in to{" "}
                            <strong className="text-es-fg">{email}</strong>. Click the button below
                            or use the temporary code.
                        </Text>
                        <Button
                            className="mb-6 box-border block rounded-lg bg-es-violet px-6 py-3 text-center text-base font-bold text-es-bg no-underline"
                            href={magicLinkUrl}
                        >
                            Sign In to Emit Signal
                        </Button>
                        <Section className="mb-6 rounded-lg border border-solid border-es-bgLine bg-es-bgElev p-5">
                            <Text className="mb-2 text-xs uppercase tracking-wider text-es-fgDim">
                                Or copy this code
                            </Text>
                            <Text
                                className="m-0 font-mono text-2xl font-bold tracking-widest text-es-fg"
                                style={{ letterSpacing: "4px" }}
                            >
                                {code.toUpperCase()}
                            </Text>
                        </Section>
                        <Text className="mb-4 text-sm text-es-fgDim">
                            This code expires in {expiresInMinutes} minute
                            {expiresInMinutes !== 1 ? "s" : ""}.
                        </Text>
                        <Text className="text-sm text-es-fgFaint">
                            If you didn&apos;t request this, you can safely ignore this email.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}

MagicLinkEmail.PreviewProps = {
    code: "a1b2c3",
    email: "dev@example.com",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    magicLinkUrl: "https://emitsignal.com/auth/verify?email=dev@example.com&code=a1b2c3",
} satisfies MagicLinkEmailProps;
