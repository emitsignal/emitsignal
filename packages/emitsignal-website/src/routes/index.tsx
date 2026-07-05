import { createFileRoute } from '@tanstack/react-router';

import { FinalCTA } from '#/components/landing/final-cta';
import { Footer } from '#/components/landing/footer';
import { Hero } from '#/components/landing/hero';
import { HowItWorks } from '#/components/landing/how-it-works';
import { Nav } from '#/components/landing/nav';
import { OpenSource } from '#/components/landing/open-source';
import { Pricing } from '#/components/landing/pricing';
import { UseCases } from '#/components/landing/use-cases';

export const Route = createFileRoute('/')({ component: LandingPage });

function LandingPage() {
    return (
        <div className="min-h-full w-full bg-bg font-sans text-fg">
            <Nav />
            <Hero />
            <HowItWorks />
            <OpenSource />
            <UseCases />
            <Pricing />
            <FinalCTA />
            <Footer />
        </div>
    );
}
