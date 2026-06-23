import { createFileRoute } from '@tanstack/react-router';

import { Footer } from '#/components/landing/footer';
import { Nav } from '#/components/landing/nav';

export const Route = createFileRoute('/privacy')({
    component: PrivacyPage,
    head: () => ({
        meta: [
            { title: 'Privacy Policy — EmitSignal' },
            {
                content:
                    'How EmitSignal collects, uses, shares, and retains personal data, and your rights under the GDPR and the LGPD.',
                name: 'description',
            },
        ],
    }),
});

const LAST_UPDATED = 'June 23, 2026';

interface TableOfContentsEntry {
    id: string;
    label: string;
}

const TABLE_OF_CONTENTS: TableOfContentsEntry[] = [
    { id: 'introduction', label: '1. Introduction & scope' },
    { id: 'controller', label: '2. Data controller & contact' },
    { id: 'data-we-collect', label: '3. Personal data we collect' },
    { id: 'how-we-use', label: '4. How we use your data & legal bases' },
    { id: 'cookies', label: '5. Cookies & similar technologies' },
    { id: 'processors', label: '6. Third-party processors' },
    { id: 'transfers', label: '7. International data transfers' },
    { id: 'retention', label: '8. Data retention' },
    { id: 'your-rights', label: '9. Your rights' },
    { id: 'security', label: '10. Security' },
    { id: 'children', label: "11. Children's privacy" },
    { id: 'changes', label: '12. Changes to this policy' },
    { id: 'contact', label: '13. Contact & complaints' },
];

interface ProcessorRow {
    data: string;
    name: string;
    purpose: string;
}

const PROCESSORS: ProcessorRow[] = [
    {
        data: 'Account identifier, email, billing details, subscription status',
        name: 'Stripe',
        purpose: 'Payment processing and subscription management',
    },
    {
        data: 'Recipient email address, email subject and content',
        name: 'Resend / SMTP provider',
        purpose: 'Transactional email (sign-in links, security alerts)',
    },
    {
        data: 'Device push token, notification title, body, and data payload',
        name: 'Expo Push Service',
        purpose: 'Delivering push notifications to mobile and web clients',
    },
    {
        data: 'GitHub account id, username, email, avatar, OAuth tokens',
        name: 'GitHub (optional OAuth)',
        purpose: 'Optional sign-in via GitHub',
    },
    {
        data: 'Error messages, stack traces, request context, account id',
        name: 'Sentry (optional)',
        purpose: 'Error and exception monitoring',
    },
    {
        data: 'Performance trace spans and attributes, account id',
        name: 'OpenTelemetry collector (optional)',
        purpose: 'Performance and reliability observability',
    },
    {
        data: 'Avatar images and message attachments',
        name: 'Object storage / S3 (optional)',
        purpose: 'File storage when the S3 provider is enabled',
    },
    {
        data: 'All persisted records; rate-limit, quota, and cache counters',
        name: 'PostgreSQL & Redis (infrastructure)',
        purpose: 'Primary database and in-memory queues/caching',
    },
];

export default function PrivacyPage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <Nav />

            {/* Hero */}
            <div className="px-5 pb-10 pt-16 sm:px-8 md:px-16 md:pt-20">
                <div className="mx-auto max-w-[860px]">
                    <Kicker>Legal</Kicker>
                    <h1 className="m-0 mb-5 text-[52px] font-semibold leading-[1.0] tracking-[-1.8px] text-fg sm:text-[64px]">
                        Privacy Policy
                    </h1>
                    <p className="mb-3 max-w-[640px] text-[18px] leading-[1.6] text-muted">
                        How EmitSignal collects, uses, shares, and retains your personal data — and
                        the rights you have under the EU General Data Protection Regulation (GDPR)
                        and Brazil&apos;s Lei Geral de Proteção de Dados (LGPD).
                    </p>
                    <p className="font-mono text-[12px] text-dim">Last updated: {LAST_UPDATED}</p>
                </div>
            </div>

            <div className="px-5 sm:px-8 md:px-16">
                <div className="mx-auto max-w-[860px]">
                    {/* Table of contents */}
                    <nav
                        aria-label="Table of contents"
                        className="rounded-xl border border-line bg-elev px-5 py-4"
                    >
                        <p className="mb-3 font-mono text-[10px] uppercase tracking-[1.6px] text-accent">
                            On this page
                        </p>
                        <ul className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-2 p-0 sm:grid-cols-2">
                            {TABLE_OF_CONTENTS.map((entry) => (
                                <li key={entry.id}>
                                    <a
                                        className="text-[13px] text-muted no-underline hover:text-fg"
                                        href={`#${entry.id}`}
                                    >
                                        {entry.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <Section id="introduction">
                        <Kicker>Section 1</Kicker>
                        <H2>Introduction &amp; scope</H2>
                        <P>
                            EmitSignal is a real-time notification platform. Publishers post
                            messages to named topics, and subscribers receive them live over
                            Server-Sent Events, push notifications, and email. This policy explains
                            what personal data we process when you use our website, API,
                            command-line tool, and mobile app, and applies to everyone who interacts
                            with the service.
                        </P>
                        <P>
                            It is written to satisfy the transparency requirements of the GDPR (for
                            individuals in the EU, EEA, and UK) and the LGPD (for individuals in
                            Brazil). Where those laws use different terms for the same concept — for
                            example &quot;controller&quot; (GDPR) and &quot;controlador&quot;
                            (LGPD), or &quot;processor&quot; and &quot;operador&quot; — they should
                            be read as equivalent.
                        </P>
                    </Section>

                    <Section id="controller">
                        <Kicker>Section 2</Kicker>
                        <H2>Data controller &amp; contact</H2>
                        <P>
                            The controller responsible for your personal data is{' '}
                            <Token>[Legal entity name]</Token>, registered at{' '}
                            <Token>[Registered address]</Token>. For any privacy question, request,
                            or complaint, contact us at <Token>[privacy@emitsignal.com]</Token>.
                        </P>
                        <P>
                            Our Data Protection Officer can be reached at{' '}
                            <Token>[dpo@emitsignal.com]</Token>. Under GDPR Article 27, our
                            representative in the EU is <Token>[EU representative]</Token>. Under
                            LGPD Article 41, our person in charge (Encarregado) in Brazil is{' '}
                            <Token>[Brazil DPO/Encarregado]</Token>.
                        </P>
                    </Section>

                    <Section id="data-we-collect">
                        <Kicker>Section 3</Kicker>
                        <H2>Personal data we collect</H2>
                        <P>
                            We collect only what we need to run the service. Depending on how you
                            use EmitSignal, this may include:
                        </P>

                        <H3>Account &amp; identity</H3>
                        <P>
                            Your email address, an optional display name, an optional avatar image,
                            email-verification status, and account timestamps. If you subscribe to a
                            paid plan we also store a billing customer identifier.
                        </P>

                        <H3>Authentication &amp; sessions</H3>
                        <P>
                            We support sign-in by email one-time code / magic link, passkeys
                            (WebAuthn), API keys, and optional GitHub OAuth. For each active session
                            we store a session token, the <strong>user-agent string</strong> of the
                            device used to sign in, and expiry timestamps. Passkeys store a public
                            key and authenticator metadata (never your biometrics). If you sign in
                            with GitHub, we store the OAuth access, refresh, and identity tokens
                            issued by GitHub.
                        </P>

                        <H3>Devices &amp; push notifications</H3>
                        <P>
                            To deliver push notifications we store a device push token, a
                            client-generated <strong>device identifier</strong>, the platform (iOS,
                            Android, or web), and your push opt-in preference. A device identifier
                            can be recorded even when you are not signed in, so that anonymous
                            subscriptions and acknowledgements work across the app.
                        </P>

                        <H3>Subscriptions &amp; topic access</H3>
                        <P>
                            Which topics a device subscribes to, per-topic notification preferences,
                            and your role (owner, publisher, or subscriber) on topics you have
                            access to.
                        </P>

                        <H3>Message content &amp; attachments</H3>
                        <P>
                            The messages you publish or receive — title, body, priority, tags,
                            images, and file attachments — together with read receipts
                            (acknowledgements) keyed to the device that read them. Message content
                            may itself contain personal data that you choose to include.
                        </P>

                        <H3>Webhook payloads</H3>
                        <P>
                            If you configure an inbound webhook, the full payload of each request we
                            receive is stored as a delivery record, along with status and timing.
                            These payloads can contain personal data forwarded from third-party
                            services you connect.
                        </P>

                        <H3>Billing</H3>
                        <P>
                            Subscription plan, status, billing interval, and period dates, linked to
                            your payment-provider customer and subscription identifiers. Card
                            details are handled by our payment processor and are never stored on our
                            servers.
                        </P>

                        <H3>Operational logs &amp; usage</H3>
                        <P>
                            Application logs (which may include your account id, the recipient
                            address of an email we send, and a provider message id), rate-limit
                            counters keyed by IP address (for anonymous traffic) or account id, and
                            daily usage quota counters. If enabled, error-monitoring and tracing
                            services receive technical diagnostic data.
                        </P>
                    </Section>

                    <Section id="how-we-use">
                        <Kicker>Section 4</Kicker>
                        <H2>How we use your data &amp; legal bases</H2>
                        <P>
                            We process personal data only where a lawful basis applies. Under the
                            GDPR (Art. 6) and the LGPD (Art. 7), the bases we rely on are:
                        </P>
                        <Ul>
                            <Li>
                                <strong>Performance of a contract</strong> (LGPD: execução de
                                contrato) — creating and operating your account, delivering messages
                                and notifications, and providing the API, CLI, and apps.
                            </Li>
                            <Li>
                                <strong>Legitimate interests</strong> (LGPD: legítimo interesse) —
                                securing the service, preventing abuse through rate limiting,
                                debugging via error monitoring, and improving reliability. We
                                balance these against your rights.
                            </Li>
                            <Li>
                                <strong>Consent</strong> (LGPD: consentimento) — sending push
                                notifications you opt into, and optional integrations you enable.
                                You can withdraw consent at any time.
                            </Li>
                            <Li>
                                <strong>Legal obligation</strong> (LGPD: cumprimento de obrigação
                                legal) — retaining billing records and responding to lawful
                                requests.
                            </Li>
                        </Ul>
                    </Section>

                    <Section id="cookies">
                        <Kicker>Section 5</Kicker>
                        <H2>Cookies &amp; similar technologies</H2>
                        <P>
                            We use a session cookie to keep you signed in on the web. In production
                            this cookie is scoped to our parent domain so that it works across our
                            application and API subdomains. We also keep a short-lived in-memory
                            cache of resolved sessions to reduce repeated authentication checks.
                        </P>
                        <P>
                            We do <strong>not</strong> use advertising or cross-site tracking
                            cookies. Mobile and CLI clients authenticate with bearer session tokens
                            rather than cookies.
                        </P>
                    </Section>

                    <Section id="processors">
                        <Kicker>Section 6</Kicker>
                        <H2>Third-party processors</H2>
                        <P>
                            We share personal data with the service providers below strictly to
                            operate EmitSignal. Optional providers only receive data when the
                            corresponding feature is configured.
                        </P>
                        <div className="overflow-x-auto rounded-xl border border-line">
                            <table className="w-full border-collapse text-left text-[13px]">
                                <thead>
                                    <tr className="border-b border-line bg-elev">
                                        <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[1.4px] text-dim">
                                            Processor
                                        </th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[1.4px] text-dim">
                                            Data shared
                                        </th>
                                        <th className="px-4 py-3 font-mono text-[10.5px] uppercase tracking-[1.4px] text-dim">
                                            Purpose
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PROCESSORS.map((processor) => (
                                        <tr
                                            className="border-b border-line last:border-0"
                                            key={processor.name}
                                        >
                                            <td className="px-4 py-3 align-top font-medium text-fg">
                                                {processor.name}
                                            </td>
                                            <td className="px-4 py-3 align-top text-muted">
                                                {processor.data}
                                            </td>
                                            <td className="px-4 py-3 align-top text-muted">
                                                {processor.purpose}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    <Section id="transfers">
                        <Kicker>Section 7</Kicker>
                        <H2>International data transfers</H2>
                        <P>
                            Some of our processors operate outside the EU/EEA or Brazil. Where
                            personal data is transferred internationally, we rely on appropriate
                            safeguards such as adequacy decisions or Standard Contractual Clauses:{' '}
                            <Token>[transfer mechanism]</Token>. You may request a copy of the
                            relevant safeguards using the contact details below.
                        </P>
                    </Section>

                    <Section id="retention">
                        <Kicker>Section 8</Kicker>
                        <H2>Data retention</H2>
                        <P>We keep personal data only as long as needed for the purposes above:</P>
                        <Ul>
                            <Li>
                                <strong>File attachments</strong> are deleted after 15 days for
                                signed-in uploaders and after 3 hours for anonymous uploaders.
                            </Li>
                            <Li>
                                <strong>Rate-limit, quota, and cache counters</strong> expire
                                automatically within minutes to hours.
                            </Li>
                            <Li>
                                <strong>
                                    Accounts, sessions, API keys, passkeys, channels, messages, and
                                    webhook delivery logs
                                </strong>{' '}
                                are retained until your account is deleted. Deleting your account
                                erases these records automatically, including the underlying message
                                attachment files. You can also purge all of your signals at any time
                                from Settings → Advanced while keeping your channels.
                            </Li>
                            <Li>
                                <strong>Billing records</strong> are retained for as long as
                                required by applicable tax and accounting law.
                            </Li>
                        </Ul>
                    </Section>

                    <Section id="your-rights">
                        <Kicker>Section 9</Kicker>
                        <H2>Your rights</H2>
                        <P>
                            Under the GDPR you have the right to access, rectify, and erase your
                            data; to restrict or object to processing; to data portability; to
                            withdraw consent; and to lodge a complaint with your supervisory
                            authority. The LGPD (Art. 18) grants equivalent rights: confirmation
                            that processing exists, access, correction,
                            anonymisation/blocking/deletion, portability, information about with
                            whom data is shared, and revocation of consent.
                        </P>
                        <P>
                            You can delete your account from Settings → Advanced, which removes your
                            profile and cascades to all related records — channels, messages, push
                            tokens, subscriptions, sessions, API keys, and passkeys — and erases
                            your stored attachment files. To request a data export, or to exercise
                            any other right, email <Token>[privacy@emitsignal.com]</Token>. We
                            respond within the timeframes required by law.
                        </P>
                    </Section>

                    <Section id="security">
                        <Kicker>Section 10</Kicker>
                        <H2>Security</H2>
                        <P>
                            We protect data in transit with TLS, store credentials as secrets, and
                            apply rate limiting to reduce abuse and brute-force attempts. In the
                            interest of transparency, you should know that OAuth tokens from
                            connected providers are currently stored without additional encryption
                            at rest. No system is perfectly secure; we work continuously to improve
                            our safeguards.
                        </P>
                    </Section>

                    <Section id="children">
                        <Kicker>Section 11</Kicker>
                        <H2>Children&apos;s privacy</H2>
                        <P>
                            EmitSignal is not directed at children under 16, and we do not knowingly
                            collect their personal data. If you believe a child has provided us
                            data, contact us and we will delete it.
                        </P>
                    </Section>

                    <Section id="changes">
                        <Kicker>Section 12</Kicker>
                        <H2>Changes to this policy</H2>
                        <P>
                            We may update this policy as the service evolves or the law changes.
                            When we make material changes we will update the &quot;Last
                            updated&quot; date above and, where appropriate, notify you. The version
                            shown here always governs.
                        </P>
                    </Section>

                    <Section id="contact">
                        <Kicker>Section 13</Kicker>
                        <H2>Contact &amp; complaints</H2>
                        <P>
                            For any privacy request, write to{' '}
                            <Token>[privacy@emitsignal.com]</Token> or our Data Protection Officer
                            at <Token>[dpo@emitsignal.com]</Token>. EU and EEA residents may also
                            lodge a complaint with their local data protection supervisory
                            authority. Brazilian residents may contact the Autoridade Nacional de
                            Proteção de Dados (ANPD).
                        </P>
                    </Section>

                    <div className="py-14" />
                </div>
            </div>

            <Footer />
        </div>
    );
}

function H2({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="mb-3 mt-0 text-[26px] font-semibold tracking-[-0.6px] text-fg">
            {children}
        </h2>
    );
}

function H3({ children }: { children: React.ReactNode }) {
    return <h3 className="mb-2 mt-4 font-mono text-[15px] font-semibold text-fg">{children}</h3>;
}

function Kicker({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[1.6px] text-accent">
            {children}
        </p>
    );
}

function Li({ children }: { children: React.ReactNode }) {
    return (
        <li className="relative pl-5 text-[14px] leading-[1.65] text-muted before:absolute before:left-0 before:text-accent before:content-['—']">
            {children}
        </li>
    );
}

function P({ children }: { children: React.ReactNode }) {
    return <p className="mb-4 text-[14px] leading-[1.65] text-muted">{children}</p>;
}

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
    return (
        <section className="border-t border-line py-14" id={id}>
            {children}
        </section>
    );
}

function Token({ children }: { children: React.ReactNode }) {
    return (
        <span className="rounded bg-elev px-1.5 py-0.5 font-mono text-[12.5px] text-accent">
            {children}
        </span>
    );
}

function Ul({ children }: { children: React.ReactNode }) {
    return <ul className="mb-4 flex list-none flex-col gap-2.5 p-0">{children}</ul>;
}
