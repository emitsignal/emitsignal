import { shareUrl } from '@emitsignal/shared/share';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Bell, Globe, Share2, UserRound } from 'lucide-react';

import { MessageArticle } from '#/components/app/inbox/message-article';
import { ShareTargets } from '#/components/share/share-targets';
import { Avatar } from '#/components/ui/avatar';
import { CodeBlock } from '#/components/ui/code-block';
import { CopyButton } from '#/components/ui/copy-button';
import { Dot } from '#/components/ui/dot';
import { Logo } from '#/components/ui/logo';
import { Pill } from '#/components/ui/pill';
import { SubHeading } from '#/components/ui/sub-head';
import { fetchSharedMessageServer, type SharedMessagePage } from '#/lib/api-server-fns';
import { relativeTime } from '#/lib/format';
import { priorityHex } from '#/lib/priority';
import { buildSeoMeta } from '#/lib/seo';
import { useSiteOrigin } from '#/lib/site-origin';

const PRIORITY_LABELS: Record<number, string> = {
    1: 'min',
    2: 'low',
    3: 'normal',
    4: 'high',
    5: 'max',
};

export const Route = createFileRoute('/s/$shareId')({
    component: SharePage,
    head: ({ loaderData, params }) => {
        const data = loaderData as null | SharedMessagePage | undefined;

        if (!data) {
            return buildSeoMeta({
                description: 'This signal is not public.',
                noindex: true,
                path: `/s/${params.shareId}`,
                title: 'Signal not found — EmitSignal',
            });
        }

        const description = data.message.body.slice(0, 200);

        return buildSeoMeta({
            description,
            image: data.ogImage,
            path: `/s/${params.shareId}`,
            title: `${data.message.title} — ${data.topic.name}`,
            type: 'article',
        });
    },
    loader: ({ params }) => fetchSharedMessageServer({ data: params.shareId }),
    validateSearch: (search: Record<string, unknown>) => ({
        payload: search.payload === '1' || search.payload === 1 || search.payload === true,
    }),
});

function NotPublic() {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-bg px-6 font-sans text-fg">
            <Logo pulse size={16} />

            <div className="max-w-[380px] text-center">
                <h1 className="m-0 mb-2.5 text-[22px] font-semibold tracking-[-0.4px]">
                    This signal isn&apos;t public.
                </h1>
                <p className="m-0 text-[13px] leading-[1.55] text-muted">
                    It may have been removed, or the topic it belongs to is private.
                </p>
            </div>

            <Link
                className="rounded-md border border-accent px-4 py-2 text-[13px] font-semibold text-accent no-underline hover:bg-accent/10"
                to="/sign-in"
            >
                Sign in
            </Link>
        </div>
    );
}

function SharePage() {
    const shared = Route.useLoaderData() as null | SharedMessagePage | undefined;
    const { shareId } = Route.useParams();
    const { payload } = Route.useSearch();
    const origin = useSiteOrigin();

    if (!shared) {
        return <NotPublic />;
    }

    const { message, sender, topic } = shared;
    const url = shareUrl(origin, shareId);

    const payloadJson = JSON.stringify(
        {
            id: message.id,
            priority: message.priority,
            published_at: new Date(message.createdAt).toISOString(),
            tags: message.tags,
            title: message.title,
            topic: topic.name,
            visibility: topic.accessMode,
        },
        null,
        2,
    );

    return (
        <div className="min-h-screen w-full bg-bg font-sans text-fg">
            <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-bg/95 px-5 py-3.5 backdrop-blur-sm sm:px-7">
                <Link className="no-underline" to="/">
                    <Logo pulse size={14} />
                </Link>
                <span className="truncate font-mono text-[11px] text-dim">/ s / {shareId}</span>
                <div className="flex-1" />
                <Link
                    className="rounded-md border border-accent px-3 py-1.5 text-[12px] font-semibold text-accent no-underline hover:bg-accent/10"
                    to="/sign-in"
                >
                    Sign in
                </Link>
            </header>

            <main className="mx-auto max-w-[680px] px-5 pb-16 pt-9 sm:px-7">
                <div className="mb-4.5 flex items-center gap-2.5 font-mono text-[11.5px] text-dim">
                    <Share2 className="text-accent" size={13} />
                    <span>Shared signal</span>
                    <span className="text-faint">·</span>
                    <span>from a public topic</span>
                </div>

                <article className="overflow-hidden rounded-2xl border border-line bg-elev">
                    <div className="px-5 pt-5 sm:px-6.5 sm:pt-5.5">
                        <div className="mb-5 flex items-center gap-3">
                            <Avatar name={topic.name} rounded={10} size={42} />
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="truncate font-mono text-[14px] font-semibold">
                                        {topic.name}
                                    </span>
                                    <Pill tone="success">
                                        <Globe className="mr-1" size={10} />
                                        public
                                    </Pill>
                                </div>
                                <div className="mt-0.5 font-mono text-[11px] text-dim">
                                    {topic.subscriberCount.toLocaleString()} subscribers
                                </div>
                            </div>
                            <div className="ml-auto flex shrink-0 items-center gap-2">
                                <Dot level={message.priority} size={7} />
                                <span
                                    className="font-mono text-[11px] font-semibold tracking-[0.6px]"
                                    style={{ color: priorityHex(message.priority) }}
                                >
                                    p{message.priority} · {PRIORITY_LABELS[message.priority]}
                                </span>
                            </div>
                        </div>

                        <h1 className="m-0 mb-4 text-[26px] font-semibold leading-[1.16] tracking-[-0.8px] sm:text-[30px]">
                            {message.title}
                        </h1>

                        <div className="mb-5.5 flex flex-wrap items-center gap-2.5 border-b border-line pb-5.5">
                            {sender?.name ? (
                                <>
                                    <Avatar
                                        name={sender.name}
                                        rounded={100}
                                        size={26}
                                        src={sender.image}
                                    />
                                    <span className="text-[13px] text-muted">
                                        Published by{' '}
                                        <span className="font-medium text-fg">{sender.name}</span>
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-elev text-dim">
                                        <UserRound size={14} />
                                    </span>
                                    <span className="text-[13px] text-muted">
                                        Published{' '}
                                        <span className="font-medium text-fg">anonymously</span>
                                    </span>
                                </>
                            )}
                            <span className="text-faint">·</span>
                            <span className="font-mono text-[11.5px] text-dim">
                                {relativeTime(message.createdAt)}
                            </span>
                        </div>
                    </div>

                    <div className="px-5 pb-5 sm:px-6.5 sm:pb-6">
                        <MessageArticle message={message} />

                        {payload && <CodeBlock code={payloadJson} label="RAW PAYLOAD" />}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 border-t border-line bg-bg px-5 py-3.5 sm:px-6.5">
                        <CopyButton className="h-9 shrink-0" value={url} />
                        <ShareTargets title={message.title} url={url} />
                        <span className="ml-auto hidden truncate font-mono text-[11px] text-dim sm:block">
                            {url.replace(/^https?:\/\//, '')}
                        </span>
                    </div>
                </article>

                <section className="mt-5.5 rounded-[14px] border border-line bg-elev p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-3.5">
                        <div className="min-w-[220px] flex-1">
                            <div className="mb-1 text-[16px] font-semibold">
                                Get <span className="font-mono text-accent">{topic.name}</span> as
                                it ships
                            </div>
                            <p className="m-0 text-[12.5px] leading-[1.5] text-muted">
                                Subscribe for push, email, or a live terminal stream. Public topic —
                                no invite needed.
                            </p>
                        </div>
                        <Link
                            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-bg no-underline hover:bg-accent-dim"
                            to="/sign-in"
                        >
                            <Bell size={13} />
                            Subscribe
                        </Link>
                    </div>

                    <div className="mt-4">
                        <SubHeading>OR FOLLOW IT FROM YOUR TERMINAL</SubHeading>
                        <CodeBlock code={`es subscribe ${topic.name}`} />
                    </div>
                </section>

                <div className="mt-5.5 flex items-center justify-center gap-2 font-mono text-[11px] text-dim">
                    <span>Shared with</span>
                    <Logo size={12} />
                    <span className="hidden text-faint sm:inline">
                        · push notifications with one curl
                    </span>
                </div>
            </main>
        </div>
    );
}
