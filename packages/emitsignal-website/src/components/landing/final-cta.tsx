import { ArrowRight, Terminal } from 'lucide-react';

import { DOCS_URL } from '#/lib/links';

import { Button } from './button';
import { Section } from './section';

export function FinalCTA() {
    return (
        <Section className="px-5 py-16 sm:px-8 md:px-16 md:py-30">
            <div className="relative text-center">
                <div>
                    <h2 className="mx-auto m-0 mb-4.5 max-w-[780px] font-sans text-[32px] font-semibold leading-none tracking-[-1px] sm:text-[44px] md:text-[58px] md:tracking-[-1.8px]">
                        One pipe. Everywhere you read.
                    </h2>
                    <p className="mx-auto mb-9 max-w-[560px] text-[17px] leading-[1.55] text-muted">
                        Free to start. No credit card, no SDK, no account needed for your first
                        signal.
                    </p>
                    <div className="inline-flex flex-wrap items-center justify-center gap-3.5">
                        <Button icon={<ArrowRight size={13} />} to="/app" variant="primary">
                            Get started
                        </Button>

                        <Button href={DOCS_URL} icon={<Terminal size={13} />}>
                            Read the docs
                        </Button>
                    </div>
                </div>
            </div>
        </Section>
    );
}
