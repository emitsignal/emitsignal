import { Apple, Check, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '#/lib/cn';
import { APP_STORE_URL } from '#/lib/links';

import { Reveal } from './reveal';
import { Section } from './section';

/** Intrinsic size of the device captures — set on each img to avoid layout shift. */
const SHOT_HEIGHT = 1348;
const SHOT_WIDTH = 620;

const POINTS = [
    'Native push on iOS and Android, with no polling and no companion service.',
    'Subscribe per channel, and mute the noisy ones individually.',
    'Publish from the app too, not just read.',
];

export function MobileSection() {
    return (
        <Section id="mobile">
            <Reveal>
                {/* The device column gets the larger share: at half width the
                    screenshots were too small to read, which defeats the point. */}
                <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
                    <div>
                        <h2 className="m-0 text-[32px] font-medium leading-[1.05] tracking-[-0.03em] text-fg md:text-[44px]">
                            It ends up in your pocket.
                        </h2>

                        <p className="m-0 mt-4 max-w-[52ch] text-[16px] leading-[1.6] text-muted">
                            That same alert reaches your phone before the command that sent it
                            returns. The apps are the other half of EmitSignal: the inbox you
                            actually carry.
                        </p>

                        <ul className="m-0 mt-8 flex list-none flex-col gap-3 p-0">
                            {POINTS.map((point) => (
                                <li className="flex items-start gap-3 text-[14.5px]" key={point}>
                                    <Check className="mt-1 shrink-0 text-accent" size={15} />
                                    <span className="text-muted">{point}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <StoreLink
                                detail="App Store"
                                href={APP_STORE_URL}
                                icon={<Apple size={17} />}
                                label="Download for iOS"
                            />
                            <StoreLink
                                detail="Google Play"
                                href="/mobile"
                                icon={<Smartphone size={17} />}
                                label="Android"
                            />
                        </div>
                    </div>

                    <PhoneCluster />
                </div>
            </Reveal>
        </Section>
    );
}

/** How long each screen holds the front position. */
const SWAP_INTERVAL_MS = 10_000;

/**
 * Both frames stack in one grid cell and are told apart only by transform, so a
 * swap is two CSS transitions rather than a re-render of the images — nothing
 * reloads, and they glide past each other.
 *
 * The order is fixed and there are no controls: it is an ambient detail, not a
 * carousel the reader is meant to operate.
 */
/**
 * ±125px at lg puts 250px between the two frames, leaving the same 80px overlap
 * the static pair had — enough of the back one stays visible to be read. The
 * offset shrinks at sm, where the column is only as wide as the viewport.
 */
const FRONT_CLASS = 'z-10 translate-y-0 scale-100 opacity-100 sm:translate-x-24 lg:translate-x-32';
const BACK_CLASS =
    'z-0 translate-y-8 scale-[0.92] opacity-0 sm:-translate-x-24 sm:opacity-70 lg:-translate-x-32';

const SCREENS = [
    {
        alt: "A message open in the EmitSignal iOS app: priority 5, 'Production API latency spike', the environment details, a p99 response-time chart, an Open trace button, and a delivery timeline ending in delivered to this device.",
        src: '/static/phone-message.webp',
    },
    {
        alt: 'The EmitSignal iOS feed: incidents grouped from P5 critical down to P4 high, each row showing its channel, title, and tags.',
        src: '/static/phone-feed.webp',
    },
];

function PhoneCluster() {
    const frontIndex = useRotatingIndex(SCREENS.length, SWAP_INTERVAL_MS);

    // Centred, not end-aligned: the front frame translates +40px, which would
    // push past the column edge and risk a horizontal scrollbar.
    return (
        <div className="relative grid justify-items-center">
            {/* Accent bloom behind the devices so they lift off the near-black ground. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 55% 45% at 55% 45%, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent 70%)',
                }}
            />

            {SCREENS.map((screen, index) => (
                <PhoneFrame
                    alt={screen.alt}
                    className={cn(
                        'col-start-1 row-start-1 transition-all duration-700 ease-in-out motion-reduce:transition-none',
                        index === frontIndex ? FRONT_CLASS : BACK_CLASS,
                    )}
                    key={screen.src}
                    src={screen.src}
                />
            ))}
        </div>
    );
}

function PhoneFrame({
    alt,
    className,
    src,
    ...rest
}: { alt: string; className?: string; src: string } & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...rest}
            className={cn(
                'w-[290px] shrink-0 rounded-[44px] border border-line bg-deep p-2.5 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)] sm:w-[330px]',
                className,
            )}
        >
            <img
                alt={alt}
                className="block w-full rounded-[36px]"
                decoding="async"
                draggable={false}
                height={SHOT_HEIGHT}
                loading="lazy"
                src={src}
                width={SHOT_WIDTH}
            />
        </div>
    );
}

function StoreLink({
    detail,
    href,
    icon,
    label,
}: {
    detail: string;
    href: string;
    icon: React.ReactNode;
    label: string;
}) {
    const external = href.startsWith('http');

    return (
        <a
            className="flex items-center gap-3 rounded-xl border border-line bg-elev px-4 py-2.5 no-underline transition-colors hover:border-accent/40"
            href={href}
            rel={external ? 'noopener noreferrer' : undefined}
            target={external ? '_blank' : undefined}
        >
            <span className="text-fg">{icon}</span>
            <span>
                <span className="block font-mono text-[9px] uppercase tracking-[1.4px] text-dim">
                    {detail}
                </span>
                <span className="block text-[13.5px] font-semibold text-fg">{label}</span>
            </span>
        </a>
    );
}

/**
 * Steps through `length` every `intervalMs`, starting at 0. Holds at 0 when the
 * reader has asked for reduced motion — the pair still reads as a stack, it just
 * stops moving on its own.
 */
function useRotatingIndex(length: number, intervalMs: number): number {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (reduced.matches) {
            return;
        }

        const timer = window.setInterval(
            () => setIndex((current) => (current + 1) % length),
            intervalMs,
        );

        return () => window.clearInterval(timer);
    }, [intervalMs, length]);

    return index;
}
