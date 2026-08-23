import { SkeletonTableRows } from '#/components/ui/skeleton';
import { usePushTokens } from '#/hooks/use-push-tokens';

import { DeviceRow } from './device-row';
import { SettingsCard } from './settings-card';
import { SettingsGroup } from './settings-group';

export function DevicesPage() {
    const { error, loading, remove, removingId, toggle, togglingId, tokens } = usePushTokens();

    return (
        <>
            <div className="mb-[26px] border-b border-line pb-[18px]">
                <h1 className="text-[22px] font-semibold tracking-[-0.4px]">Devices</h1>
                <p className="mt-1 max-w-[620px] text-[13px] leading-[1.55] text-muted">
                    Every phone and browser registered to receive push notifications. Turn one off
                    to stop delivery to it without signing out, or remove it entirely. Push tokens
                    themselves are never displayed here.
                </p>
            </div>

            <div>
                <SettingsCard
                    description="A device stops receiving push notifications the moment you turn it off, across every channel."
                    title="Push targets"
                >
                    {error ? (
                        <p className="mb-3 font-mono text-[12px] text-danger">{error}</p>
                    ) : null}

                    {loading ? (
                        <SkeletonTableRows columns={[28, 34, 14]} rows={2} />
                    ) : tokens.length === 0 ? (
                        <p className="font-mono text-[12px] text-dim">
                            No devices registered yet. Sign in on the mobile app and allow
                            notifications to see it here.
                        </p>
                    ) : (
                        <SettingsGroup>
                            {tokens.map((token) => (
                                <DeviceRow
                                    key={token.id}
                                    onRemove={remove}
                                    onToggle={toggle}
                                    removing={removingId === token.id}
                                    toggling={togglingId === token.id}
                                    token={token}
                                />
                            ))}
                        </SettingsGroup>
                    )}
                </SettingsCard>
            </div>
        </>
    );
}
