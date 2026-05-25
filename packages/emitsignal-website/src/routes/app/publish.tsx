import { createFileRoute } from '@tanstack/react-router';
import { AlertCircle, Check, Zap } from 'lucide-react';
import { useState } from 'react';

import { PreviewColumn } from '#/components/app/publish/preview-column';
import { Toolbar } from '#/components/app/toolbar';
import { SubHeading } from '#/components/ui/sub-head';
import { usePublish } from '#/hooks/use-publish';
import { useTopics } from '#/hooks/use-topics';
import { api } from '#/lib/api';
import { cn } from '#/lib/cn';

interface DeliveryOption {
    enabled: boolean;
    label: string;
}

const DELIVERY: DeliveryOption[] = [
    { enabled: true, label: 'push · all subs' },
    { enabled: true, label: 'email · p>=4' },
    { enabled: true, label: 'slack #releases' },
    { enabled: false, label: 'sms · on-call' },
    { enabled: false, label: 'webhook → datadog' },
];

export const Route = createFileRoute('/app/publish')({ component: ComposePage });

function ComposePage() {
    const { topics } = useTopics();
    const { error, loading, publish } = usePublish();
    const [sent, setSent] = useState(false);

    const [topicName, setTopicName] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [priority, setPriority] = useState(3);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const selectedTopic = topics.find((topic) => topic.name === topicName) ?? null;

    const handlePublish = async () => {
        if (!topicName.trim() || !title.trim()) return;
        setSent(false);

        try {
            await publish(topicName.trim(), {
                body: body.trim(),
                priority,
                tags,
                title: title.trim(),
            });
            setSent(true);
        } catch {
            // error handled by hook
        }
    };

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
        }
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter((existingTag) => existingTag !== tag));
    };

    return (
        <>
            <Toolbar
                actions={
                    <div className="flex gap-2">
                        <button className="rounded-md border border-line px-2.5 py-1 font-mono text-[12px] text-muted hover:bg-elev">
                            save as template
                        </button>
                        <button
                            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-[12px] font-semibold text-bg hover:bg-accent-dim disabled:opacity-60"
                            disabled={loading || !topicName.trim() || !title.trim()}
                            onClick={handlePublish}
                        >
                            <Zap size={12} /> {loading ? 'sending…' : 'Send signal'}
                        </button>
                    </div>
                }
                subtitle={`POST ${api.baseUrl}/:topic`}
                title="Publish a message"
            />

            {error && (
                <div className="mx-4 mt-3 flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-3.5 py-2.5">
                    <AlertCircle className="text-danger" size={14} />
                    <span className="font-mono text-[12px] text-danger">{error.message}</span>
                </div>
            )}

            {sent && !error && !loading && (
                <div className="mx-4 mt-3 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3.5 py-2.5">
                    <Check className="text-success" size={14} />
                    <span className="font-mono text-[12px] text-success">message published</span>
                </div>
            )}

            <div className="flex min-h-0 flex-1">
                <div className="min-w-0 flex-1 overflow-auto border-r border-line p-7">
                    <SubHeading>topic</SubHeading>
                    <div className="mb-5.5">
                        <input
                            className="w-full rounded-lg border border-accent/40 bg-elev px-3.5 py-2.5 font-mono text-[13px] text-fg outline-none placeholder:text-faint focus:border-accent"
                            onChange={(event) => setTopicName(event.target.value)}
                            placeholder="deploy/prod"
                            value={topicName}
                        />
                        {topics.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {topics.slice(0, 6).map((topic) => (
                                    <button
                                        className="rounded-full border border-line bg-chip px-2 py-0.5 font-mono text-[11px] text-muted hover:bg-elev"
                                        key={topic.id}
                                        onClick={() => setTopicName(topic.name)}
                                    >
                                        {topic.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedTopic && (
                            <p className="mt-2 font-mono text-[10.5px] text-dim">
                                {selectedTopic.description ?? 'existing topic'} ·{' '}
                                {selectedTopic.isPublic ? 'public' : 'private'}
                            </p>
                        )}
                    </div>

                    <SubHeading>title</SubHeading>
                    <input
                        className="mb-4 w-full rounded-lg border border-line bg-elev px-3.5 py-3 font-mono text-[15px] font-semibold text-fg outline-none placeholder:text-faint focus:border-accent"
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Deploy succeeded · api-gateway v2.14.3"
                        value={title}
                    />

                    <SubHeading>body · markdown</SubHeading>
                    <textarea
                        className="mb-5.5 min-h-[100px] w-full resize-y rounded-lg border border-line bg-elev px-3.5 py-3 font-mono text-[13px] leading-[1.5] text-muted outline-none placeholder:text-faint focus:border-accent"
                        onChange={(event) => setBody(event.target.value)}
                        placeholder="Describe your message…"
                        value={body}
                    />

                    <div className="mb-5.5 grid grid-cols-[1fr_1.4fr] gap-5">
                        <div>
                            <SubHeading>priority</SubHeading>
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((priorityValue) => (
                                    <PriorityChip
                                        key={priorityValue}
                                        onClick={() => setPriority(priorityValue)}
                                        selected={priorityValue === priority}
                                        value={priorityValue}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <SubHeading>tags</SubHeading>
                            <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-lg border border-line bg-elev px-2 py-1.5">
                                {tags.map((tag) => (
                                    <span
                                        className="rounded border border-line bg-chip px-2 py-0.5 font-mono text-[11px] text-muted"
                                        key={tag}
                                    >
                                        {tag}
                                        <button
                                            className="ml-1.5 cursor-pointer border-none bg-transparent p-0 font-mono text-[11px] text-faint hover:text-dim"
                                            onClick={() => removeTag(tag)}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                <input
                                    className="min-w-[60px] flex-1 border-none bg-transparent font-mono text-[11px] text-fg outline-none placeholder:text-dim"
                                    onChange={(event) => setTagInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ',') {
                                            event.preventDefault();
                                            addTag(tagInput);
                                        }
                                        if (
                                            event.key === 'Backspace' &&
                                            !tagInput &&
                                            tags.length > 0
                                        ) {
                                            removeTag(tags[tags.length - 1]);
                                        }
                                    }}
                                    placeholder={tags.length === 0 ? '+ add tag' : ''}
                                    value={tagInput}
                                />
                            </div>
                        </div>
                    </div>

                    <SubHeading>delivery</SubHeading>
                    <div className="flex flex-wrap gap-2">
                        {DELIVERY.map((delivery, index) => (
                            <DeliveryChip key={index} option={delivery} />
                        ))}
                    </div>
                </div>

                <PreviewColumn
                    body={body}
                    priority={priority}
                    tags={tags}
                    title={title}
                    topicName={topicName}
                />
            </div>
        </>
    );
}

function DeliveryChip({ option }: { option: DeliveryOption }) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11.5px] font-medium border',
                option.enabled
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-elev border-line text-muted',
            )}
        >
            <span
                className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    option.enabled ? 'bg-accent' : 'bg-faint',
                )}
            />
            {option.label}
        </div>
    );
}

function PriorityChip({
    onClick,
    selected,
    value,
}: {
    onClick: () => void;
    selected: boolean;
    value: number;
}) {
    return (
        <button
            className={cn(
                'flex-1 cursor-pointer rounded-md py-2 text-center font-mono text-[12px] font-semibold border',
                selected
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-elev border-line text-muted',
            )}
            onClick={onClick}
        >
            p{value}
        </button>
    );
}
