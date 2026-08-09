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

export const Route = createFileRoute('/')({ component: LandingPage });

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
