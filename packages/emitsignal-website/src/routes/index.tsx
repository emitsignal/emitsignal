import { createFileRoute } from '@tanstack/react-router';

import { CliSection } from '#/components/landing/cli-section';
import { FeatureSplit } from '#/components/landing/feature-split';
import { FinalCta } from '#/components/landing/final-cta';
import { Hero } from '#/components/landing/hero';
import { MobileSection } from '#/components/landing/mobile-section';
import { MockPublish } from '#/components/landing/mock-publish';
import { Pipeline } from '#/components/landing/pipeline';
import { Pricing } from '#/components/landing/pricing';
import { ProductFrame } from '#/components/landing/product-frame';
import { SiteFooter } from '#/components/site/site-footer';
import { SiteNav, SiteNavWordmark } from '#/components/site/site-nav';
import { APP_STORE_URL, REPO_URL } from '#/lib/links';
import { buildSeoMeta, jsonLdScript, SITE_NAME, SITE_URL } from '#/lib/seo';

const APPLICATION_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    applicationCategory: 'DeveloperApplication',
    description:
        'Publish a message to a named topic with a single HTTP request and receive it on your phone, in your terminal, or in your inbox.',
    name: SITE_NAME,
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
    },
    operatingSystem: 'iOS, Android, Web, Linux, macOS',
    sameAs: [REPO_URL, APP_STORE_URL],
    url: SITE_URL,
};

export const Route = createFileRoute('/')({
    component: LandingPage,
    head: () => ({
        ...buildSeoMeta({ path: '/' }),
        scripts: [jsonLdScript(APPLICATION_SCHEMA)],
    }),
});

/** The landing page. */
function LandingPage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <SiteNav>
                <SiteNavWordmark />
            </SiteNav>

            <main>
                <Hero />
                <ProductFrame />

                <FeatureSplit
                    body="Any process that can make an HTTP request can publish. Topics are plain strings: no provisioning, no registry, no SDK. POST a body and it is delivered."
                    eyebrow="Publish"
                    headline="One verb. Zero SDKs."
                    id="publish"
                    mock={<MockPublish />}
                    points={[
                        'JSON body or plain headers, both work',
                        'Priority, tags, and delayed delivery via headers',
                        'Works from shell, CI, cron, or a Lambda',
                    ]}
                />

                <Pipeline />
                <MobileSection />
                <CliSection />
                <Pricing />
                <FinalCta />
            </main>

            <SiteFooter />
        </div>
    );
}
