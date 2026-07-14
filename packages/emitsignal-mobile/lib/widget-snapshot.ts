import { type InfiniteData } from '@tanstack/react-query';

import {
    api,
    type Message,
    type PaginatedResponse,
    type Subscription,
    type SubscriptionMetricsMap,
} from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { buildWidgetSnapshot } from '@/lib/widget-snapshot-builder';
import { writeWidgetSnapshot } from '@/lib/widget-storage';
import { getReadIds } from '@/storage/read-messages';

export type {
    BuildWidgetSnapshotInput,
    WidgetSnapshot,
    WidgetSnapshotChannel,
    WidgetSnapshotMessage,
    WidgetSnapshotVolume,
} from '@/lib/widget-snapshot-builder';
export { buildWidgetSnapshot } from '@/lib/widget-snapshot-builder';

export interface SyncWidgetSnapshotOptions {
    deviceId: null | string;
    scheme: string;
    scope: string;
    userId: null | string;
}

// Assembles a snapshot from the react-query cache (feed + subscriptions) plus
// a metrics fetch (cached 180s), then hands it to the widget extension.
export async function syncWidgetSnapshot(options: SyncWidgetSnapshotOptions): Promise<void> {
    const { deviceId, scheme, scope, userId } = options;

    if (!scope) {
        return;
    }

    const feed = queryClient.getQueryData<InfiniteData<PaginatedResponse<Message>>>(
        queryKeys.feed(scope),
    );

    const subscriptions =
        queryClient.getQueryData<Subscription[]>(queryKeys.subscriptions(scope)) ?? [];

    let metrics: SubscriptionMetricsMap = {};

    if (subscriptions.length > 0) {
        try {
            metrics = await queryClient.fetchQuery({
                queryFn: () =>
                    api.listSubscriptionMetrics(userId ? undefined : (deviceId ?? undefined)),
                queryKey: queryKeys.subscriptionMetrics(scope),
                staleTime: 180_000,
            });
        } catch {
            metrics = {};
        }
    }

    const readIds = await getReadIds();

    const snapshot = buildWidgetSnapshot({
        messages: feed?.pages.flatMap((page) => page.data) ?? [],
        metrics,
        readIds,
        scheme,
        subscriptions,
    });

    writeWidgetSnapshot(JSON.stringify(snapshot));
}
