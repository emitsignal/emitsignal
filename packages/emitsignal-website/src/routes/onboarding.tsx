import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import type { TopicSuggestion } from '#/lib/api';

import { Avatar } from '#/components/ui/avatar';
import { Logo } from '#/components/ui/logo';
import { useSession } from '#/ctx/session';
import { api, API_URL } from '#/lib/api';
import { authClient } from '#/lib/auth-client';
import { isAuthenticated } from '#/lib/auth-guard';
import { queryKeys } from '#/lib/query-client';
import { getDeviceId } from '#/lib/storage';

export const Route = createFileRoute('/onboarding')({
    beforeLoad: async ({ preload }) => {
        if (preload) {
            return;
        }

        if (!(await isAuthenticated())) {
            throw redirect({ to: '/sign-in' });
        }
    },
    component: OnboardingPage,
});

const FALLBACK_TOPICS: TopicSuggestion[] = [
    { description: 'ships & rollbacks', displayName: 'deploy/prod', name: 'deploy/prod' },
    { description: 'pages & incidents', displayName: 'alerts/prod', name: 'alerts/prod' },
    { description: 'build + test runs', displayName: 'ci/web', name: 'ci/web' },
    { description: 'runtime exceptions', displayName: 'errors/web', name: 'errors/web' },
];

function hashHue(name: string): number {
    let hash = 0;

    for (let index = 0; index < name.length; index++) {
        hash = (hash * 31 + name.charCodeAt(index)) & 0xfffff;
    }

    return hash % 360;
}

function OnboardingPage() {
    const { loading, user } = useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [busy, setBusy] = useState(false);
    const [name, setName] = useState('');
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [picked, setPicked] = useState<Set<string>>(new Set(['alerts/prod', 'deploy/prod']));
    const [previewUrl, setPreviewUrl] = useState<null | string>(null);
    const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);

    const redirected = useRef(false);

    useEffect(() => {
        if (loading || redirected.current) {
            return;
        }

        // The account already knows onboarding is done — skip straight to the app.
        if (user?.onboarded) {
            redirected.current = true;
            navigate({ to: '/app' });
        }
    }, [loading, user, navigate]);

    const synced = useRef(false);

    useEffect(() => {
        if (user && !synced.current) {
            setName(user.name ?? '');

            synced.current = true;
        }
    }, [user]);

    useEffect(() => {
        const deviceId = getDeviceId();

        api.getSuggestions(deviceId)
            .then((data) => {
                const slice = data.slice(0, 4);

                setSuggestions(slice.length ? slice : FALLBACK_TOPICS);

                const initial = new Set(
                    slice.filter((s) => s.name.startsWith('emitsignal/')).map((s) => s.name),
                );
                setPicked(initial.size ? initial : new Set(['alerts/prod', 'deploy/prod']));
            })
            .catch(() => setSuggestions(FALLBACK_TOPICS));
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setPendingFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const toggle = (topicName: string) =>
        setPicked((prev) => {
            const next = new Set(prev);

            const action = next.has(topicName) ? 'delete' : 'add';

            next[action](topicName);

            return next;
        });

    const handleFinish = async () => {
        setBusy(true);

        try {
            if (pendingFile) {
                const form = new FormData();
                form.append('file', pendingFile);
                const res = await fetch(`${API_URL}/user/avatar`, {
                    body: form,
                    credentials: 'include',
                    method: 'POST',
                });

                if (res.ok) {
                    const { imageUrl } = (await res.json()) as { imageUrl: string };
                    await authClient.updateUser({ image: imageUrl });
                }
            }

            const trimmed = name.trim();

            if (trimmed && trimmed !== user?.name) {
                await authClient.updateUser({ name: trimmed });
            }

            await authClient.updateUser({ onboarded: true });

            const deviceId = getDeviceId();

            await Promise.allSettled(
                [...picked].map((topicName) => api.subscribe(deviceId, topicName, false)),
            );
        } catch {
            // non-fatal
        } finally {
            setBusy(false);
        }

        await queryClient.invalidateQueries({ queryKey: queryKeys.session });

        navigate({ to: '/app' });
    };

    const handleSkip = async () => {
        await authClient.updateUser({ onboarded: true }).catch(() => {});

        await queryClient.invalidateQueries({ queryKey: queryKeys.session });

        navigate({ to: '/app' });
    };

    const avatarName = user?.name || user?.email || '';
    const pickedCount = picked.size;

    return (
        <div
            className="relative min-h-screen overflow-hidden font-sans"
            style={{
                background: '#0f0a1a',
                backgroundImage: `radial-gradient(640px 460px at 50% 60px, rgba(109,40,217,0.38), transparent 68%)`,
            }}
        >
            {/* Top bar */}
            <div className="relative z-10 flex items-center justify-between px-7 py-5">
                <Logo pulse size={15} />
                <div className="flex items-center gap-4">
                    <span className="font-mono text-[11px] tracking-[1px] text-dim">
                        STEP 1 OF 1
                    </span>
                    <button
                        className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent font-mono text-[11.5px] text-dim hover:text-muted"
                        onClick={handleSkip}
                        type="button"
                    >
                        Skip for now
                        <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 16 16"
                        >
                            <path
                                d="M3 8h10M9 4l4 4-4 4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Centered column */}
            <div className="flex justify-center px-6 pb-16 pt-5">
                <div className="w-full max-w-[420px] text-center">
                    {/* ── Avatar hero ── */}
                    <div className="relative mx-auto mb-[22px]" style={{ height: 120, width: 120 }}>
                        {/* outer glow ring */}
                        <div
                            className="pointer-events-none absolute"
                            style={{
                                border: '1px solid rgba(167,139,250,0.15)',
                                borderRadius: 36,
                                inset: -22,
                            }}
                        />
                        {/* inner glow ring */}
                        <div
                            className="pointer-events-none absolute"
                            style={{
                                border: '1px solid rgba(167,139,250,0.25)',
                                borderRadius: 30,
                                inset: -11,
                            }}
                        />

                        {/* avatar */}
                        <button
                            className="h-full w-full cursor-pointer overflow-hidden border-0 bg-transparent p-0"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ borderRadius: 28 }}
                            title="Upload a photo"
                            type="button"
                        >
                            {previewUrl ? (
                                <img
                                    alt="Your avatar"
                                    className="h-full w-full object-cover"
                                    src={previewUrl}
                                    style={{ borderRadius: 28 }}
                                />
                            ) : (
                                <Avatar name={avatarName} rounded={28} size={120} />
                            )}
                        </button>

                        {/* plus badge */}
                        <div
                            className="absolute flex items-center justify-center"
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                background: '#a78bfa',
                                border: '4px solid #0f0a1a',
                                borderRadius: 99,
                                bottom: -2,
                                cursor: 'pointer',
                                height: 36,
                                right: -2,
                                width: 36,
                            }}
                        >
                            <svg
                                className="h-4 w-4 text-bg"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.2}
                                viewBox="0 0 16 16"
                            >
                                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                            </svg>
                        </div>

                        <input
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            type="file"
                        />
                    </div>

                    {/* heading */}
                    <h1
                        className="m-0 text-fg"
                        style={{ fontSize: 27, fontWeight: 700, letterSpacing: -0.7 }}
                    >
                        Hey there — who are you?
                    </h1>
                    <p
                        className="mx-auto mt-2.5 mb-[26px] text-muted"
                        style={{ fontSize: 13.5, lineHeight: 1.55, maxWidth: 320 }}
                    >
                        This is the name and face on every signal you emit.
                    </p>

                    {/* Name input */}
                    <div className="mb-[26px] text-left">
                        <div className="mb-1.5 flex items-baseline justify-between">
                            <span className="text-[13px] font-medium text-fg">Your name</span>
                        </div>
                        <input
                            autoComplete="name"
                            className="h-[42px] w-full rounded-[9px] border border-line bg-elev px-3.5 text-[14px] text-fg outline-none transition-colors placeholder:text-faint focus:border-accent"
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Alex Carter"
                            value={name}
                        />
                    </div>

                    {/* Topic suggestions */}
                    {suggestions.length > 0 && (
                        <div className="mb-[26px] text-left">
                            <div className="mb-[11px] flex items-baseline justify-between">
                                <span className="text-[13px] font-semibold text-fg">
                                    Subscribe to a few topics
                                </span>
                                <span
                                    className="font-mono text-[10.5px]"
                                    style={{ color: pickedCount ? '#a78bfa' : '#7a6d99' }}
                                >
                                    {pickedCount} selected · optional
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {suggestions.map((suggestion) => {
                                    const on = picked.has(suggestion.name);
                                    return (
                                        <TopicChip
                                            key={suggestion.name}
                                            on={on}
                                            onToggle={() => toggle(suggestion.name)}
                                            topic={suggestion}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <button
                        className="mb-3.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] border-0 font-sans font-bold text-bg disabled:opacity-60"
                        disabled={busy}
                        onClick={handleFinish}
                        style={{
                            background: '#a78bfa',
                            boxShadow: '0 6px 22px rgba(124,58,237,0.35)',
                            fontSize: 14.5,
                            height: 46,
                            letterSpacing: -0.2,
                        }}
                        type="button"
                    >
                        {busy ? 'setting up…' : "That's me — let's go"}
                        {!busy && (
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.2}
                                viewBox="0 0 16 16"
                            >
                                <path
                                    d="M3 8h10M9 4l4 4-4 4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </button>

                    <p className="mt-3.5 font-mono text-[11px] text-dim">
                        You can change all of this anytime in Settings.
                    </p>
                </div>
            </div>
        </div>
    );
}

function TopicChip({
    on,
    onToggle,
    topic,
}: {
    on: boolean;
    onToggle: () => void;
    topic: TopicSuggestion;
}) {
    return (
        <button
            className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border-0 px-[11px] py-[9px] text-left transition-colors"
            onClick={onToggle}
            style={{
                background: on ? 'rgba(124,58,237,0.12)' : '#0f0a1a',
                border: `1px solid ${on ? 'rgba(124,58,237,0.53)' : '#2a2340'}`,
            }}
            type="button"
        >
            <TopicGlyph name={topic.name} />

            <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[12px] font-medium text-fg">
                    {topic.name}
                </div>
                {topic.description && (
                    <div className="truncate text-[10.5px] text-dim">{topic.description}</div>
                )}
            </div>

            <div
                className="flex shrink-0 items-center justify-center transition-colors"
                style={{
                    background: on ? '#a78bfa' : 'transparent',
                    border: `1px solid ${on ? '#a78bfa' : '#2a2340'}`,
                    borderRadius: 99,
                    height: 20,
                    width: 20,
                }}
            >
                {on ? (
                    <svg
                        className="h-3 w-3 text-bg"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        viewBox="0 0 12 12"
                    >
                        <polyline points="1.5,6 5,9.5 10.5,2.5" />
                    </svg>
                ) : (
                    <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="#7a6d99"
                        strokeWidth={2.2}
                        viewBox="0 0 12 12"
                    >
                        <path d="M6 2v8M2 6h8" strokeLinecap="round" />
                    </svg>
                )}
            </div>
        </button>
    );
}

function TopicGlyph({ name }: { name: string }) {
    const hue = hashHue(name);
    const initials = name
        .split('/')
        .map((part) => part[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');

    return (
        <div
            className="flex shrink-0 items-center justify-center rounded-[7px] font-mono text-[11px] font-semibold"
            style={{
                background: `oklch(0.30 0.10 ${hue})`,
                color: `oklch(0.88 0.12 ${hue})`,
                height: 28,
                width: 28,
            }}
        >
            {initials}
        </div>
    );
}
