import { createFileRoute } from '@tanstack/react-router';

import { SiteFooter } from '#/components/site/site-footer';
import { SiteNav, SiteNavWordmark } from '#/components/site/site-nav';
import { buildSeoMeta } from '#/lib/seo';

const DESCRIPTION =
    'The standards of behaviour we expect from everyone who participates in the EmitSignal community — our platform, repositories, and communication channels.';
const TITLE = 'Code of Conduct - EmitSignal';

export const Route = createFileRoute('/code-of-conduct')({
    component: CodeOfConductPage,
    head: () => buildSeoMeta({ description: DESCRIPTION, path: '/code-of-conduct', title: TITLE }),
});

const LAST_UPDATED = 'July 4, 2026';

interface TableOfContentsEntry {
    id: string;
    label: string;
}

const TABLE_OF_CONTENTS: TableOfContentsEntry[] = [
    { id: 'pledge', label: '1. Our pledge' },
    { id: 'standards', label: '2. Our standards' },
    { id: 'responsibilities', label: '3. Enforcement responsibilities' },
    { id: 'scope', label: '4. Scope' },
    { id: 'enforcement', label: '5. Reporting & enforcement' },
    { id: 'guidelines', label: '6. Enforcement guidelines' },
    { id: 'attribution', label: '7. Attribution' },
];

function CodeOfConductPage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <SiteNav variant="pinned">
                <SiteNavWordmark />
            </SiteNav>

            {/* Hero */}
            <div className="px-5 pb-10 pt-16 sm:px-8 md:px-16 md:pt-20">
                <div className="mx-auto max-w-[860px]">
                    <Kicker>Community</Kicker>
                    <h1 className="m-0 mb-5 text-[52px] font-semibold leading-[1.0] tracking-[-1.8px] text-fg sm:text-[64px]">
                        Code of Conduct
                    </h1>
                    <p className="mb-3 max-w-[640px] text-[18px] leading-[1.6] text-muted">
                        EmitSignal is built and used by a broad community. This code sets the
                        standards of behaviour we expect from everyone who takes part — across our
                        platform, our repositories, and every channel where we gather.
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

                    <Section id="pledge">
                        <Kicker>Section 1</Kicker>
                        <H2>Our pledge</H2>
                        <P>
                            We as members, contributors, and leaders pledge to make participation in
                            the EmitSignal community a harassment-free experience for everyone,
                            regardless of age, body size, visible or invisible disability,
                            ethnicity, sex characteristics, gender identity and expression, level of
                            experience, education, socio-economic status, nationality, personal
                            appearance, race, religion, or sexual identity and orientation.
                        </P>
                        <P>
                            We pledge to act and interact in ways that contribute to an open,
                            welcoming, diverse, inclusive, and healthy community.
                        </P>
                    </Section>

                    <Section id="standards">
                        <Kicker>Section 2</Kicker>
                        <H2>Our standards</H2>
                        <P>
                            Examples of behaviour that contributes to a positive environment for our
                            community include:
                        </P>
                        <Ul>
                            <Li>Demonstrating empathy and kindness toward other people.</Li>
                            <Li>
                                Being respectful of differing opinions, viewpoints, and experiences.
                            </Li>
                            <Li>Giving and gracefully accepting constructive feedback.</Li>
                            <Li>
                                Accepting responsibility and apologising to those affected by our
                                mistakes, and learning from the experience.
                            </Li>
                            <Li>
                                Focusing on what is best not just for us as individuals, but for the
                                overall community.
                            </Li>
                        </Ul>
                        <P>Examples of unacceptable behaviour include:</P>
                        <Ul>
                            <Li>
                                The use of sexualised language or imagery, and sexual attention or
                                advances of any kind.
                            </Li>
                            <Li>
                                Trolling, insulting or derogatory comments, and personal or
                                political attacks.
                            </Li>
                            <Li>Public or private harassment.</Li>
                            <Li>
                                Publishing others&apos; private information, such as a physical or
                                email address, without their explicit permission.
                            </Li>
                            <Li>
                                Using EmitSignal topics, messages, or attachments to distribute the
                                above, or any other conduct which could reasonably be considered
                                inappropriate in a professional setting.
                            </Li>
                        </Ul>
                    </Section>

                    <Section id="responsibilities">
                        <Kicker>Section 3</Kicker>
                        <H2>Enforcement responsibilities</H2>
                        <P>
                            Community leaders are responsible for clarifying and enforcing our
                            standards of acceptable behaviour and will take appropriate and fair
                            corrective action in response to any behaviour that they deem
                            inappropriate, threatening, offensive, or harmful.
                        </P>
                        <P>
                            Community leaders have the right and responsibility to remove, edit, or
                            reject comments, commits, code, wiki edits, issues, messages, and other
                            contributions that are not aligned to this Code of Conduct, and will
                            communicate reasons for moderation decisions when appropriate.
                        </P>
                    </Section>

                    <Section id="scope">
                        <Kicker>Section 4</Kicker>
                        <H2>Scope</H2>
                        <P>
                            This Code of Conduct applies within all community spaces — including our
                            repositories, issue trackers, discussions, and the EmitSignal platform
                            itself — and also applies when an individual is officially representing
                            the community in public spaces. Examples of representing our community
                            include using an official email address, posting via an official social
                            media account, or acting as an appointed representative at an online or
                            offline event.
                        </P>
                    </Section>

                    <Section id="enforcement">
                        <Kicker>Section 5</Kicker>
                        <H2>Reporting &amp; enforcement</H2>
                        <P>
                            Instances of abusive, harassing, or otherwise unacceptable behaviour may
                            be reported to the community leaders responsible for enforcement at{' '}
                            <Token>[conduct@emitsignal.com]</Token>. All complaints will be reviewed
                            and investigated promptly and fairly.
                        </P>
                        <P>
                            All community leaders are obligated to respect the privacy and security
                            of the reporter of any incident.
                        </P>
                    </Section>

                    <Section id="guidelines">
                        <Kicker>Section 6</Kicker>
                        <H2>Enforcement guidelines</H2>
                        <P>
                            Community leaders will follow these Community Impact Guidelines in
                            determining the consequences for any action they deem in violation of
                            this Code of Conduct:
                        </P>
                        <Ul>
                            <Li>
                                <strong>1. Correction</strong> — For behaviour deemed inappropriate,
                                unprofessional, or unwelcome: a private, written warning, providing
                                clarity around the nature of the violation and why it was
                                inappropriate. A public apology may be requested.
                            </Li>
                            <Li>
                                <strong>2. Warning</strong> — For a violation through a single
                                incident or series of actions: a warning with consequences for
                                continued behaviour, including no interaction with the people
                                involved for a specified period.
                            </Li>
                            <Li>
                                <strong>3. Temporary ban</strong> — For a serious violation of
                                community standards, including sustained inappropriate behaviour: a
                                temporary ban from any sort of interaction or public communication
                                with the community for a specified period.
                            </Li>
                            <Li>
                                <strong>4. Permanent ban</strong> — For demonstrating a pattern of
                                violation of community standards, harassment of an individual, or
                                aggression toward or disparagement of classes of individuals: a
                                permanent ban from any sort of public interaction within the
                                community.
                            </Li>
                        </Ul>
                    </Section>

                    <Section id="attribution">
                        <Kicker>Section 7</Kicker>
                        <H2>Attribution</H2>
                        <P>
                            This Code of Conduct is adapted from the{' '}
                            <a
                                className="text-accent no-underline hover:underline"
                                href="https://www.contributor-covenant.org/version/2/1/code_of_conduct.html"
                                rel="noreferrer"
                                target="_blank"
                            >
                                Contributor Covenant
                            </a>
                            , version 2.1. Community Impact Guidelines were inspired by
                            Mozilla&apos;s code of conduct enforcement ladder.
                        </P>
                    </Section>

                    <div className="py-14" />
                </div>
            </div>

            <SiteFooter />
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
        <li className="relative pl-5 text-[14px] leading-[1.65] text-muted before:absolute before:left-0 before:text-accent before:content-['-']">
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
