import { createFileRoute } from '@tanstack/react-router';

import { Footer } from '#/components/landing/footer';
import { Nav } from '#/components/landing/nav';

export const Route = createFileRoute('/terms')({
    component: TermsPage,
    head: () => ({
        meta: [
            { title: 'Terms of Service — EmitSignal' },
            {
                content:
                    'The terms and conditions that govern your use of EmitSignal — accounts, acceptable use, plans, billing, liability, and termination.',
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
    { id: 'agreement', label: '1. Agreement to these terms' },
    { id: 'definitions', label: '2. Definitions' },
    { id: 'eligibility', label: '3. Eligibility & accounts' },
    { id: 'service', label: '4. The service' },
    { id: 'acceptable-use', label: '5. Acceptable use' },
    { id: 'your-content', label: '6. Your content & messages' },
    { id: 'api', label: '7. API, CLI & rate limits' },
    { id: 'plans', label: '8. Plans, billing & payment' },
    { id: 'cancellation', label: '9. Cancellation & refunds' },
    { id: 'intellectual-property', label: '10. Intellectual property' },
    { id: 'third-party', label: '11. Third-party services' },
    { id: 'availability', label: '12. Availability & changes' },
    { id: 'termination', label: '13. Suspension & termination' },
    { id: 'disclaimers', label: '14. Disclaimers' },
    { id: 'liability', label: '15. Limitation of liability' },
    { id: 'indemnification', label: '16. Indemnification' },
    { id: 'governing-law', label: '17. Governing law & disputes' },
    { id: 'changes', label: '18. Changes to these terms' },
    { id: 'contact', label: '19. Contact' },
];

export default function TermsPage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <Nav />

            {/* Hero */}
            <div className="px-5 pb-10 pt-16 sm:px-8 md:px-16 md:pt-20">
                <div className="mx-auto max-w-[860px]">
                    <Kicker>Legal</Kicker>
                    <h1 className="m-0 mb-5 text-[52px] font-semibold leading-[1.0] tracking-[-1.8px] text-fg sm:text-[64px]">
                        Terms of Service
                    </h1>
                    <p className="mb-3 max-w-[640px] text-[18px] leading-[1.6] text-muted">
                        The terms and conditions that govern your access to and use of EmitSignal —
                        our website, API, command-line tool, and mobile app. Please read them
                        carefully.
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

                    <Section id="agreement">
                        <Kicker>Section 1</Kicker>
                        <H2>Agreement to these terms</H2>
                        <P>
                            These Terms of Service (&quot;Terms&quot;) form a binding agreement
                            between you and <Token>[Legal entity name]</Token>{' '}
                            (&quot;EmitSignal&quot;, &quot;we&quot;, &quot;us&quot;) and govern your
                            use of the EmitSignal service. By creating an account, publishing or
                            subscribing to a topic, or otherwise using the service, you agree to
                            these Terms. If you are using EmitSignal on behalf of an organisation,
                            you represent that you are authorised to bind that organisation.
                        </P>
                        <P>
                            If you do not agree with these Terms, do not use the service. Your use
                            of personal data is described separately in our{' '}
                            <a className="text-accent no-underline hover:underline" href="/privacy">
                                Privacy Policy
                            </a>
                            .
                        </P>
                    </Section>

                    <Section id="definitions">
                        <Kicker>Section 2</Kicker>
                        <H2>Definitions</H2>
                        <Ul>
                            <Li>
                                <strong>Service</strong> — the EmitSignal real-time notification
                                platform, including the website, API, CLI, and mobile app.
                            </Li>
                            <Li>
                                <strong>Topic</strong> — a named channel to which publishers post
                                messages and subscribers listen.
                            </Li>
                            <Li>
                                <strong>Message</strong> — any content you publish to a topic,
                                including title, body, tags, images, and attachments.
                            </Li>
                            <Li>
                                <strong>Account</strong> — the credentials and profile associated
                                with your use of the service.
                            </Li>
                        </Ul>
                    </Section>

                    <Section id="eligibility">
                        <Kicker>Section 3</Kicker>
                        <H2>Eligibility &amp; accounts</H2>
                        <P>
                            You must be at least 16 years old to use EmitSignal. Some features, such
                            as publishing from the CLI or subscribing on a device, are available
                            without an account; others require you to sign in by email one-time
                            code, passkey, API key, or a connected provider.
                        </P>
                        <P>
                            You are responsible for keeping your credentials, API keys, and session
                            tokens secure, and for all activity that occurs under your account.
                            Notify us promptly if you suspect unauthorised use.
                        </P>
                    </Section>

                    <Section id="service">
                        <Kicker>Section 4</Kicker>
                        <H2>The service</H2>
                        <P>
                            EmitSignal lets publishers post messages to named topics and lets
                            subscribers receive them in real time over Server-Sent Events, push
                            notifications, and email. We provide the service on an ongoing basis but
                            may add, change, or remove features over time, as described in Section
                            12.
                        </P>
                    </Section>

                    <Section id="acceptable-use">
                        <Kicker>Section 5</Kicker>
                        <H2>Acceptable use</H2>
                        <P>You agree not to use the service to:</P>
                        <Ul>
                            <Li>
                                Send unsolicited bulk messages, spam, or content you are not
                                authorised to distribute.
                            </Li>
                            <Li>
                                Transmit unlawful, infringing, harassing, deceptive, or malicious
                                content, or malware.
                            </Li>
                            <Li>
                                Circumvent rate limits, quotas, or access controls, or probe, scan,
                                or attempt to breach the security of the service.
                            </Li>
                            <Li>
                                Impersonate others, misuse another person&apos;s data, or violate
                                any applicable law or third-party right.
                            </Li>
                            <Li>
                                Place an unreasonable load on our infrastructure or disrupt the
                                experience of other users.
                            </Li>
                        </Ul>
                        <P>
                            We may investigate suspected violations and take any action we consider
                            appropriate, including removing content and suspending accounts.
                        </P>
                    </Section>

                    <Section id="your-content">
                        <Kicker>Section 6</Kicker>
                        <H2>Your content &amp; messages</H2>
                        <P>
                            You retain ownership of the messages and content you publish. You grant
                            us a limited licence to host, process, transmit, and display that
                            content solely to operate and deliver the service to you and your
                            subscribers.
                        </P>
                        <P>
                            You are solely responsible for the content you publish and for ensuring
                            you have the rights and any consents needed to send it, including where
                            messages contain other people&apos;s personal data. File attachments are
                            stored only temporarily — currently 15 days for signed-in uploaders and
                            3 hours for anonymous uploaders — after which they are removed.
                        </P>
                    </Section>

                    <Section id="api">
                        <Kicker>Section 7</Kicker>
                        <H2>API, CLI &amp; rate limits</H2>
                        <P>
                            Access to the API and CLI is subject to rate limits and usage quotas
                            that vary by plan and by whether a request is authenticated. These
                            limits exist to keep the service reliable for everyone. We may adjust
                            them, and you must not attempt to evade them. Continued excessive use
                            may result in throttling or suspension.
                        </P>
                    </Section>

                    <Section id="plans">
                        <Kicker>Section 8</Kicker>
                        <H2>Plans, billing &amp; payment</H2>
                        <P>
                            EmitSignal offers a free plan and paid plans (Pulse and Beam) with
                            higher quotas and additional features. Paid subscriptions are billed in
                            advance on a recurring monthly or yearly basis through our payment
                            processor, Stripe. By subscribing you authorise us, via Stripe, to
                            charge your payment method for the applicable fees and any taxes.
                        </P>
                        <P>
                            Fees are stated at the point of purchase. We may change pricing on a
                            prospective basis; changes will not affect the current paid period and
                            we will give reasonable notice before they take effect at renewal.
                        </P>
                    </Section>

                    <Section id="cancellation">
                        <Kicker>Section 9</Kicker>
                        <H2>Cancellation &amp; refunds</H2>
                        <P>
                            You can cancel a paid subscription at any time from your account
                            settings. Cancellation takes effect at the end of the current billing
                            period, and you keep paid features until then. Except where required by
                            law, payments are non-refundable and we do not provide refunds or
                            credits for partial periods.
                        </P>
                    </Section>

                    <Section id="intellectual-property">
                        <Kicker>Section 10</Kicker>
                        <H2>Intellectual property</H2>
                        <P>
                            The service, including its software, design, and branding, is owned by
                            EmitSignal and its licensors and is protected by intellectual property
                            laws. These Terms grant you a limited, non-exclusive, non-transferable
                            right to use the service in accordance with them. We reserve all rights
                            not expressly granted.
                        </P>
                    </Section>

                    <Section id="third-party">
                        <Kicker>Section 11</Kicker>
                        <H2>Third-party services</H2>
                        <P>
                            The service relies on third-party providers — including payment, email,
                            push-notification, authentication, and infrastructure providers
                            described in our Privacy Policy — and may let you connect external
                            services through webhooks. We are not responsible for third-party
                            services, and your use of them may be subject to their own terms.
                        </P>
                    </Section>

                    <Section id="availability">
                        <Kicker>Section 12</Kicker>
                        <H2>Availability &amp; changes</H2>
                        <P>
                            We aim to keep the service available and reliable but do not guarantee
                            uninterrupted or error-free operation. We may perform maintenance, and
                            we may modify, suspend, or discontinue any part of the service. The free
                            plan is provided as-is and may change at any time.
                        </P>
                    </Section>

                    <Section id="termination">
                        <Kicker>Section 13</Kicker>
                        <H2>Suspension &amp; termination</H2>
                        <P>
                            You may stop using the service and delete your account at any time.
                            Deleting your account removes your profile and cascades to all related
                            records — channels, messages, push tokens, subscriptions, sessions, API
                            keys, and passkeys — and erases your stored attachment files. We may
                            suspend or terminate your access if you breach these Terms, create risk
                            or legal exposure for us, or for prolonged inactivity. Provisions that
                            by their nature should survive termination — including ownership,
                            disclaimers, liability limits, and indemnification — will continue to
                            apply.
                        </P>
                    </Section>

                    <Section id="disclaimers">
                        <Kicker>Section 14</Kicker>
                        <H2>Disclaimers</H2>
                        <P>
                            The service is provided &quot;as is&quot; and &quot;as available&quot;,
                            without warranties of any kind, whether express, implied, or statutory,
                            including any implied warranties of merchantability, fitness for a
                            particular purpose, and non-infringement. We do not warrant that
                            messages will always be delivered, delivered on time, or delivered to
                            every channel. Do not rely on EmitSignal as the sole mechanism for
                            safety-critical or emergency alerts.
                        </P>
                    </Section>

                    <Section id="liability">
                        <Kicker>Section 15</Kicker>
                        <H2>Limitation of liability</H2>
                        <P>
                            To the maximum extent permitted by law, EmitSignal will not be liable
                            for any indirect, incidental, special, consequential, or punitive
                            damages, or for any loss of profits, data, or goodwill, arising from or
                            related to your use of the service. Our total aggregate liability for
                            any claim will not exceed the greater of the amounts you paid us in the
                            twelve months before the claim or <Token>[liability cap amount]</Token>.
                            Some jurisdictions do not allow certain limitations, so some of the
                            above may not apply to you.
                        </P>
                    </Section>

                    <Section id="indemnification">
                        <Kicker>Section 16</Kicker>
                        <H2>Indemnification</H2>
                        <P>
                            You agree to indemnify and hold EmitSignal harmless from any claims,
                            damages, liabilities, and expenses (including reasonable legal fees)
                            arising out of your content, your use of the service, or your breach of
                            these Terms or of any law or third-party right.
                        </P>
                    </Section>

                    <Section id="governing-law">
                        <Kicker>Section 17</Kicker>
                        <H2>Governing law &amp; disputes</H2>
                        <P>
                            These Terms are governed by the laws of{' '}
                            <Token>[Governing law jurisdiction]</Token>, without regard to its
                            conflict-of-laws rules. You agree that any dispute will be subject to
                            the exclusive jurisdiction of the courts located in{' '}
                            <Token>[Courts / venue]</Token>, except where mandatory
                            consumer-protection law grants you the right to bring proceedings in
                            your place of residence.
                        </P>
                    </Section>

                    <Section id="changes">
                        <Kicker>Section 18</Kicker>
                        <H2>Changes to these terms</H2>
                        <P>
                            We may update these Terms as the service evolves or the law changes.
                            When we make material changes we will update the &quot;Last
                            updated&quot; date above and, where appropriate, notify you. Your
                            continued use of the service after changes take effect constitutes
                            acceptance of the revised Terms.
                        </P>
                    </Section>

                    <Section id="contact">
                        <Kicker>Section 19</Kicker>
                        <H2>Contact</H2>
                        <P>
                            Questions about these Terms can be sent to{' '}
                            <Token>[legal@emitsignal.com]</Token>, or by post to{' '}
                            <Token>[Legal entity name]</Token>, <Token>[Registered address]</Token>.
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
