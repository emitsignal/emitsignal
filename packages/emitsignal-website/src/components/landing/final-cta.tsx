import { DOCS_URL } from '#/lib/links';

import { Button } from './button';
import { Reveal } from './reveal';
import { Section } from './section';

export function FinalCta() {
    return (
        <Section className="py-20 md:py-28">
            <Reveal>
                <div className="mx-auto max-w-[760px] text-center">
                    <h2 className="m-0 text-[34px] font-medium leading-[1.0] tracking-[-0.035em] text-fg sm:text-[46px] lg:text-[58px]">
                        One pipe. Everywhere you read.
                    </h2>

                    <p className="m-0 mx-auto mt-5 max-w-[540px] text-[16px] leading-[1.6] text-muted md:text-[17px]">
                        EmitSignal is free to start and open to self-host. Publish your first signal
                        with a single command. No SDK, no client library, no account for your
                        scripts.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Button monospace={false} to="/app" variant="contrast">
                            Get started
                        </Button>

                        <Button href={DOCS_URL} monospace={false}>
                            Read the docs
                        </Button>
                    </div>
                </div>
            </Reveal>
        </Section>
    );
}
