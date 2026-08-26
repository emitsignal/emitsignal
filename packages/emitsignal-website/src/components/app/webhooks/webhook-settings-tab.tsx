import { ChevronDown } from 'lucide-react';

import { Dot } from '#/components/ui/dot';
import { useSubscriptions } from '#/ctx/subscriptions';

interface WebhookSettingsTabProps {
    error: null | string;
    onTopicNameChange: (topicName: string) => void;
    topicName: string;
}

export function WebhookSettingsTab({
    error,
    onTopicNameChange,
    topicName,
}: WebhookSettingsTabProps) {
    const { subscriptions } = useSubscriptions();
    const missing = !!error && !topicName.trim();

    return (
        <div className="px-5 py-4">
            <div className="mb-1 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[1px] text-dim">
                Publish to channel
                <span className="normal-case tracking-normal text-faint">
                    required · where deliveries land
                </span>
            </div>

            <div
                className="flex items-center gap-2 rounded-lg border bg-elev px-3 py-2"
                style={{ borderColor: missing ? 'var(--color-danger)' : 'var(--color-line)' }}
            >
                <Dot level={2} size={6} />

                <select
                    className="flex-1 bg-transparent font-mono text-[12px] text-fg outline-none"
                    onChange={(event) => onTopicNameChange(event.target.value)}
                    value={topicName}
                >
                    <option disabled value="">
                        Select a channel…
                    </option>

                    {subscriptions.map((subscription) => (
                        <option key={subscription.id} value={subscription.topic.name}>
                            {subscription.topic.displayName}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none text-dim" size={13} />
            </div>

            {error && <div className="mt-1 font-mono text-[10.5px] text-danger">{error}</div>}
        </div>
    );
}
