import { isValidTopicName } from '@emitsignal/shared/topic';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Dot } from '#/components/ui/dot';
import { useSubscriptions } from '#/ctx/subscriptions';

interface WebhookChannelFieldProps {
    invalid: boolean;
    onChange: (topicName: string) => void;
    source: string;
    value: string;
}

const NEW_CHANNEL = '__new__';

// A webhook may target a channel that does not exist yet; the first delivery creates it.
// So a fresh account can name one here instead of leaving to create it and coming back.
export function suggestChannelName(source: string): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    let suffix = '';

    for (const byte of bytes) {
        suffix += alphabet[byte % alphabet.length];
    }

    return `${source}-${suffix}`;
}

export function WebhookChannelField({
    invalid,
    onChange,
    source,
    value,
}: WebhookChannelFieldProps) {
    const { subscriptions } = useSubscriptions();
    // Derived until the user picks a mode, so an account with no channels lands
    // straight in the naming field even if subscriptions arrive after mount.
    const [chosenMode, setChosenMode] = useState<'new' | 'select' | null>(null);
    const creating = chosenMode ? chosenMode === 'new' : subscriptions.length === 0;

    // A suggestion the user has not replaced keeps tracking the source. Keyed by source so
    // re-running on the value it just set does not suggest again forever.
    const suggested = useRef({ name: '', source: '' });

    useEffect(() => {
        if (!creating || suggested.current.source === source) {
            return;
        }

        if (value !== '' && value !== suggested.current.name) {
            return;
        }

        const next = suggestChannelName(source);

        suggested.current = { name: next, source };
        onChange(next);
    }, [creating, onChange, source, value]);

    const nameTaken = subscriptions.some((subscription) => subscription.topic.name === value);
    const malformed = creating && value.trim() !== '' && !isValidTopicName(value.trim());

    function handleSelect(next: string) {
        if (next === NEW_CHANNEL) {
            setChosenMode('new');
            onChange(suggestChannelName(source));

            return;
        }

        onChange(next);
    }

    return (
        <div>
            <div className="mb-2 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[1.3px] text-dim">
                Publish to channel
                {creating && subscriptions.length > 0 && (
                    <button
                        className="cursor-pointer normal-case tracking-normal text-accent"
                        onClick={() => {
                            setChosenMode('select');
                            onChange(subscriptions[0]?.topic.name ?? '');
                        }}
                        type="button"
                    >
                        pick existing
                    </button>
                )}
            </div>

            <div
                className="flex items-center gap-2 rounded-lg border bg-elev px-3 py-2"
                style={{
                    borderColor: invalid || malformed ? 'var(--color-danger)' : 'var(--color-line)',
                }}
            >
                <Dot level={2} size={6} />

                {creating ? (
                    <input
                        className="flex-1 bg-transparent font-mono text-[12px] text-fg outline-none placeholder:text-faint"
                        onChange={(event) => onChange(event.target.value)}
                        placeholder="new-channel-name"
                        spellCheck={false}
                        value={value}
                    />
                ) : (
                    <>
                        <select
                            className="flex-1 bg-transparent font-mono text-[12px] text-fg outline-none"
                            onChange={(event) => handleSelect(event.target.value)}
                            value={nameTaken ? value : ''}
                        >
                            <option disabled value="">
                                Select a channel…
                            </option>

                            <optgroup label="Your channels">
                                {subscriptions.map((subscription) => (
                                    <option key={subscription.id} value={subscription.topic.name}>
                                        {subscription.topic.displayName}
                                    </option>
                                ))}
                            </optgroup>

                            <optgroup label="New">
                                <option value={NEW_CHANNEL}>+ Create a new channel…</option>
                            </optgroup>
                        </select>
                        <ChevronDown className="pointer-events-none text-dim" size={13} />
                    </>
                )}
            </div>

            {malformed && (
                <div className="mt-1 font-mono text-[10.5px] text-danger">
                    Lowercase letters, numbers, dash, underscore and slash only.
                </div>
            )}

            {creating && !malformed && value.trim() !== '' && !nameTaken && (
                <div className="mt-1 font-mono text-[10.5px] text-faint">
                    Created on the first delivery.
                </div>
            )}
        </div>
    );
}
