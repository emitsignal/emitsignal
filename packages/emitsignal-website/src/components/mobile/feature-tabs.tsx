import { Bell, Inbox, Radio, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { API_URL_CLEAN } from '#/lib/api';
import { cn } from '#/lib/cn';

/** How long a tab holds before the strip advances on its own. */
const DWELL_MS = 9_000;

/** Intrinsic size of the device captures — set on each img to avoid layout shift. */
const SHOT_HEIGHT = 1348;
const SHOT_WIDTH = 620;

interface Feature {
    body: string;
    icon: typeof Bell;
    id: string;
    label: string;
    media: Media;
    points: string[];
}

type Media =
    | { alt: string; kind: 'shot'; src: string }
    | { kind: 'quickstart' }
    | { kind: 'subscription' };

const FEATURES: Feature[] = [
    {
        body: 'Signals land the moment they are published over a live SSE connection. No pull-to-refresh, no polling. Priority sets the colour, so what needs you is obvious at arm’s length.',
        icon: Inbox,
        id: 'feed',
        label: 'Feed',
        media: {
            alt: 'The EmitSignal iOS feed: twelve messages across six channels, filter chips for all, p4+, unread and tags, and incidents grouped from P5 critical down to P4 high.',
            kind: 'shot',
            src: '/static/phone-feed.webp',
        },
        points: [
            'Live SSE stream, reconnecting across network changes',
            'Three layouts: comfy, timeline, or priority-first',
            'Filter to p4+, to unread, or to any tag in view',
            'Banner images, attachments, and an image viewer',
        ],
    },
    {
        body: 'Delivery runs through APNs and FCM, so a signal reaches the phone whether or not the app is open. Tapping the notification opens that exact message.',
        icon: Bell,
        id: 'push',
        label: 'Push',
        media: {
            alt: 'A message open in the EmitSignal iOS app: priority 5, Production API latency spike, a p99 response-time chart, an Open trace button, and a delivery timeline ending in delivered to this device.',
            kind: 'shot',
            src: '/static/phone-message.webp',
        },
        points: [
            'Native push on iOS and Android, no companion service',
            'Tap to deep-link straight to the signal',
            'Per-subscription push toggle, at subscribe time or later',
            'A delivery timeline on every message',
        ],
    },
    {
        body: 'Subscribe by typing a topic name. Nothing to provision first. Each subscription carries its own settings, so a noisy channel can go quiet without unsubscribing.',
        icon: Radio,
        id: 'channels',
        label: 'Channels',
        media: { kind: 'subscription' },
        points: [
            'Subscribe to any topic by name, with suggestions',
            'Mute push per channel and keep the messages',
            'Choose how far back a new subscription reads',
            'Per-channel volume over the last 24 hours',
        ],
    },
    {
        body: 'The compose tab is a full publisher, not a toy. It shows you the HTTP call it is about to make, so the app doubles as documentation.',
        icon: Send,
        id: 'publish',
        label: 'Publish',
        media: { kind: 'quickstart' },
        points: [
            'Topic, title, body, priority, and tags',
            'Recent and owned topics suggested as you type',
            'Acknowledge and view actions arrive on the message',
            'The equivalent curl, built from what you typed',
        ],
    },
];

export function FeatureTabs() {
    const [activeId, setActiveId] = useState(FEATURES[0].id);
    const [paused, setPaused] = useState(false);

    useAutoAdvance({
        onAdvance: () =>
            setActiveId((current) => {
                const index = FEATURES.findIndex((feature) => feature.id === current);

                return FEATURES[(index + 1) % FEATURES.length].id;
            }),
        paused,
        // Keyed on the open tab so clicking one restarts the dwell instead of
        // inheriting whatever was left of the previous tick.
        resetKey: activeId,
    });

    const active = FEATURES.find((feature) => feature.id === activeId) ?? FEATURES[0];

    return (
        // Pausing on hover matters: the panel is the only way to read the
        // bullets, and having it slide away mid-sentence is hostile.
        <div
            className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[1fr_520px] lg:gap-12"
            onFocusCapture={() => setPaused(true)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="flex flex-col gap-px overflow-hidden rounded-2xl border border-line bg-line">
                {FEATURES.map((feature) => (
                    <TabRow
                        active={feature.id === activeId}
                        feature={feature}
                        key={feature.id}
                        onSelect={() => setActiveId(feature.id)}
                        paused={paused}
                    />
                ))}
            </div>

            <MediaPanel feature={active} />
        </div>
    );
}

function MediaPanel({ feature }: { feature: Feature }) {
    return (
        <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-line bg-deep p-6 lg:min-h-full">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse 60% 50% at 50% 40%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 70%)',
                }}
            />

            <div className="relative w-full animate-[signal-rise_360ms_ease-out]" key={feature.id}>
                {feature.media.kind === 'shot' && (
                    <div className="mx-auto w-[300px] rounded-[42px] border border-line bg-deep p-2.5 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.95)]">
                        <img
                            alt={feature.media.alt}
                            className="block w-full rounded-[34px]"
                            decoding="async"
                            draggable={false}
                            height={SHOT_HEIGHT}
                            loading="lazy"
                            src={feature.media.src}
                            width={SHOT_WIDTH}
                        />
                    </div>
                )}

                {feature.media.kind === 'subscription' && <SubscriptionCard />}
                {feature.media.kind === 'quickstart' && <QuickstartCard />}
            </div>
        </div>
    );
}

function Progress({ paused }: { paused: boolean }) {
    return (
        <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px origin-left bg-accent motion-reduce:hidden"
            style={{
                animation: `signal-progress ${DWELL_MS}ms linear forwards`,
                animationPlayState: paused ? 'paused' : 'running',
            }}
        />
    );
}

function QuickstartCard() {
    return (
        <div className="mx-auto max-w-[380px]">
            <p className="m-0 mb-3 font-mono text-[10px] uppercase tracking-[1.6px] text-faint">
                curl · anywhere
            </p>

            <div className="overflow-x-auto rounded-xl border border-line bg-elev px-4 py-4">
                <code className="block whitespace-pre font-mono text-[12px] leading-[1.7]">
                    <span className="text-dim">curl -d </span>
                    <span className="text-warn">&quot;Deploy succeeded&quot;</span>
                    <span className="text-dim"> \</span>
                    {'\n  '}
                    <span className="text-dim">-H </span>
                    <span className="text-warn">&quot;Content-Type: application/json&quot;</span>
                    <span className="text-dim"> \</span>
                    {'\n  '}
                    <span className="text-accent">{API_URL_CLEAN}/topic/deploy/prod</span>
                </code>
            </div>

            <p className="m-0 mt-3 text-[12.5px] leading-[1.5] text-muted">
                Rebuilt as you type, with the topic and body you entered.
            </p>
        </div>
    );
}

const options = [
    { description: 'Only messages published after you subscribe', label: 'New messages only' },
    { description: 'Include messages from before you subscribed', label: 'Include past' },
];

function SubscriptionCard() {
    return (
        <div className="mx-auto max-w-[380px]">
            <p className="m-0 mb-3 font-mono text-[10px] uppercase tracking-[1.6px] text-faint">
                Subscription settings
            </p>

            <div className="flex flex-col gap-px overflow-hidden rounded-xl border border-line bg-line">
                <div className="flex items-center justify-between gap-4 bg-elev px-4 py-3.5">
                    <span className="text-[13.5px] font-semibold text-fg">Push</span>
                    <span className="flex h-[22px] w-[38px] items-center rounded-full bg-accent px-[3px]">
                        <span className="ml-auto h-4 w-4 rounded-full bg-bg" />
                    </span>
                </div>

                {options.map((option, index) => (
                    <div className="flex items-start gap-3 bg-elev px-4 py-3" key={option.label}>
                        <span
                            className={cn(
                                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                                index === 0 ? 'border-accent' : 'border-faint',
                            )}
                        >
                            {index === 0 && <span className="h-2 w-2 rounded-full bg-accent" />}
                        </span>
                        <span>
                            <span className="block text-[13px] font-medium text-fg">
                                {option.label}
                            </span>
                            <span className="block text-[12px] leading-[1.45] text-muted">
                                {option.description}
                            </span>
                        </span>
                    </div>
                ))}
            </div>

            <p className="m-0 mt-3 text-[12.5px] leading-[1.5] text-muted">
                Set when you subscribe, editable any time from the channel menu.
            </p>
        </div>
    );
}

function TabRow({
    active,
    feature,
    onSelect,
    paused,
}: {
    active: boolean;
    feature: Feature;
    onSelect: () => void;
    paused: boolean;
}) {
    const Icon = feature.icon;

    return (
        <button
            aria-current={active}
            className={cn(
                'relative overflow-hidden px-5 py-5 text-left transition-colors',
                active ? 'bg-elev-2' : 'bg-elev hover:bg-elev-2/60',
            )}
            onClick={onSelect}
            type="button"
        >
            {active ? <Progress paused={paused} /> : null}

            <p className="m-0 flex items-center gap-2.5">
                <Icon className={active ? 'text-accent' : 'text-dim'} size={15} />
                <span
                    className={cn(
                        'font-mono text-[10.5px] uppercase tracking-[1.4px]',
                        active ? 'text-accent' : 'text-dim',
                    )}
                >
                    {feature.label}
                </span>
            </p>

            <p
                className={cn(
                    'm-0 mt-2 text-[15.5px] leading-[1.55]',
                    active ? 'text-fg' : 'text-muted',
                )}
            >
                {feature.body}
            </p>

            {active && (
                <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
                    {feature.points.map((point) => (
                        <li className="flex items-start gap-2 text-[12.5px] text-muted" key={point}>
                            <span className="mt-px font-mono text-accent">→</span>
                            {point}
                        </li>
                    ))}
                </ul>
            )}
        </button>
    );
}

function useAutoAdvance({
    onAdvance,
    paused,
    resetKey,
}: {
    onAdvance: () => void;
    paused: boolean;
    resetKey: string;
}) {
    const callback = useRef(onAdvance);

    callback.current = onAdvance;

    useEffect(() => {
        if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const timer = window.setTimeout(() => callback.current(), DWELL_MS);

        return () => window.clearTimeout(timer);
    }, [paused, resetKey]);
}
