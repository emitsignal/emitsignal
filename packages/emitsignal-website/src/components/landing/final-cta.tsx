import { ArrowRight, Terminal } from 'lucide-react';

import { Button } from './button';
import { Section } from './section';

export function FinalCTA() {
    return (
        <Section className="px-16 py-30">
            <div className="relative text-center">
                <div
                    className="pointer-events-none absolute -top-10 left-[20%] right-[20%] h-[200px] blur-3xl"
                    style={{
                        background:
                            'radial-gradient(ellipse at center, rgba(167,139,250,0.2), transparent 70%)',
                    }}
                />
                <div className="relative">
                    <h2 className="mx-auto m-0 mb-4.5 max-w-[780px] font-sans text-[58px] font-semibold leading-none tracking-[-1.8px]">
                        One pipe. Everywhere you read.
                    </h2>
                    <p className="mx-auto mb-9 max-w-[560px] text-[17px] leading-[1.55] text-muted">
                        Free to start. No credit card. No SDK.{' '}
                        <strong className="text-fg">Thirty seconds</strong> from{' '}
                        <em className="not-italic text-fg">brew install</em> to your first signal.
                    </p>
                    <div className="inline-flex items-center gap-3.5">
                        <Button icon={<ArrowRight size={13} />} to="/app" variant="primary">
                            Get started · free
                        </Button>
                        <Button href="#how" icon={<Terminal size={13} />}>
                            read the docs
                        </Button>
                    </div>
                </div>
            </div>
        </Section>
    );
}
