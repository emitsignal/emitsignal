import type { ReactNode } from 'react';

import { Check } from 'lucide-react';

import { cn } from '#/lib/cn';

import { Eyebrow } from './eyebrow';
import { Reveal } from './reveal';
import { Section } from './section';

interface FeatureSplitProps {
    body: string;
    eyebrow: string;
    headline: string;
    id?: string;
    mock: ReactNode;
    points: string[];
    reverse?: boolean;
}

export function FeatureSplit({
    body,
    eyebrow,
    headline,
    id,
    mock,
    points,
    reverse = false,
}: FeatureSplitProps) {
    return (
        <Section id={id}>
            <Reveal>
                <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-2 md:gap-20">
                    <div className={cn(reverse && 'md:order-2')}>
                        <Eyebrow>{eyebrow}</Eyebrow>

                        <h2 className="m-0 text-[34px] font-medium leading-[1.02] tracking-[-0.03em] text-fg md:text-[50px]">
                            {headline}
                        </h2>

                        <p className="m-0 mt-6 max-w-[46ch] text-[17px] leading-[1.65] text-muted">
                            {body}
                        </p>

                        <ul className="m-0 mt-8 flex list-none flex-col gap-3 p-0">
                            {points.map((point) => (
                                <li className="flex items-start gap-3 text-[15px]" key={point}>
                                    <Check className="mt-1 shrink-0 text-accent" size={15} />
                                    <span className="text-muted">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={cn(reverse && 'md:order-1')}>{mock}</div>
                </div>
            </Reveal>
        </Section>
    );
}
