import type { BillingInfo } from './billing.ts';
import type { MessageFilterParams } from './message-filters.ts';

const REQUEST_TIMEOUT_MS = 15_000;

export type AccessMode = 'private' | 'public' | 'readonly';

export interface Action {
    label?: string;
    type: 'acknowledge' | 'view';
    url?: string;
}

export interface Attachment {
    filename: string;
    mimeType: string;
    size: number;
    storageKey: string;
    url: string;
}

export type ListenSince = 'always' | 'subscription_date';

// Flexible publisher input for bannerImage/inlineImages/inlineAttachments:
// a bare URL string, a {title, href} object, or an array mixing both.
export type MediaInput = Array<MediaRef | string> | MediaRef | string;

export interface MediaRef {
    href: string;
    title?: string;
}

export interface Message {
    acknowledgmentCount: number;
    actions: Action[];
    attachments: Attachment[];
    bannerImage: MediaRef | null;
    body: string;
    createdAt: number;
    id: string;
    inlineAttachments: MediaRef[];
    inlineImages: MediaRef[];
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    title: string;
    topicId: string;
    topicName?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    nextCursor: null | string;
}

export interface PushToken {
    deviceId: string;
    id: string;
    platform: string;
    pushEnabled: boolean;
}

export interface Subscription {
    createdAt: number;
    id: string;
    pushEnabled: boolean;
    settings: SubscriptionSettings;
    topic: Topic;
}

export interface SubscriptionMetrics {
    messageCount24h: number;
    volume: number[];
}

export type SubscriptionMetricsMap = Record<string, SubscriptionMetrics>;

export interface SubscriptionSettings {
    description?: string;
    listenSince: ListenSince;
}

export interface Topic {
    accessMode: AccessMode;
    createdAt: number;
    description?: null | string;
    displayName: string;
    id: string;
    isOwner?: boolean;
    name: string;
    ownerId?: null | string;
}

export interface TopicMetrics {
    messageCount24h: number;
    p5Count24h: number;
    subscriberCount: number;
    volume: number[];
}

export interface TopicSuggestion {
    description: null | string;
    displayName: string;
    name: string;
}

export interface TopicWithCounts extends Topic {
    messageCount: number;
    subscriberCount: number;
}

export interface Webhook {
    count24h: number;
    createdAt: number;
    id: string;
    lastDeliveryAt: null | number;
    name: string;
    slug: string;
    source: string;
    status: 'active' | 'error' | 'paused';
    template?: null | string;
    templated: boolean;
    topicName: string;
    updatedAt: number;
}

export interface WebhookDelivery {
    channel: string;
    createdAt: number;
    durationMs: number;
    expiresAt: null | number;
    id: string;
    messageId: null | string;
    payload: Record<string, unknown>;
    source: string;
    status: number;
    templated: boolean;
    time: string;
    webhookId: string;
}

export interface WebhookTemplate {
    body?: string;
    link?: string;
    linkLabel?: string;
    priority?: string;
    tags?: string;
    title?: string;
}

export function createApiClient(baseUrl: string) {
    let authToken: null | string = null;

    function setAuthToken(token: null | string): void {
        authToken = token;
    }

    function getAuthToken(): null | string {
        return authToken;
    }

    async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...((init.headers ?? {}) as Record<string, string>),
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch(`${baseUrl}${path}`, {
                credentials: 'include',
                ...init,
                headers,
                signal: controller.signal,
            });

            if (!response.ok) {
                const text = await response.text().catch(() => response.statusText);
                throw new Error(`${response.status} ${text}`);
            }

            if (response.status === 204) {
                return undefined as T;
            }

            return (await response.json()) as T;
        } finally {
            clearTimeout(timeout);
        }
    }

    const api = {
        acknowledgeMessage(messageId: string, deviceId: string) {
            // Attribution is derived from the authenticated session server-side;
            // the client no longer sends a (spoofable) userId.
            return request<{ acknowledged: boolean; count: number }>(
                `/messages/${encodeURIComponent(messageId)}/acknowledge`,
                {
                    body: JSON.stringify({ deviceId }),
                    method: 'POST',
                },
            );
        },

        baseUrl,

        claimSubscriptions(deviceId: string) {
            return request<{ claimed: number }>('/subscriptions/claim', {
                body: JSON.stringify({ deviceId }),
                method: 'POST',
            });
        },

        claimTopic(name: string, input?: { accessMode?: AccessMode }) {
            return request<Topic>(`/topics/${encodeURIComponent(name)}/claim`, {
                body: JSON.stringify(input ?? {}),
                method: 'POST',
            });
        },

        createWebhook(input: {
            name?: string;
            source?: string;
            template?: null | string;
            topicName: string;
        }) {
            return request<{ endpointUrl: string } & Webhook>('/webhooks', {
                body: JSON.stringify(input),
                method: 'POST',
            });
        },

        deleteWebhook(id: string) {
            return request<void>(`/webhooks/${encodeURIComponent(id)}`, { method: 'DELETE' });
        },

        getBilling() {
            return request<BillingInfo>('/billing');
        },

        getMessage(id: string) {
            return request<Message>(`/messages/${encodeURIComponent(id)}`);
        },

        getSuggestions(deviceId?: string) {
            const query = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
            return request<TopicSuggestion[]>(`/suggestions${query}`);
        },

        getTopic(name: string) {
            return request<TopicWithCounts>(`/topics/${encodeURIComponent(name)}`);
        },

        getTopicMetrics(topicName: string) {
            return request<TopicMetrics>(`/topics/${encodeURIComponent(topicName)}/metrics`);
        },

        getWebhook(id: string) {
            return request<Webhook>(`/webhooks/${encodeURIComponent(id)}`);
        },

        listMessages(
            topicName: string,
            options?: { cursor?: string; limit?: number } & MessageFilterParams,
        ) {
            const params = new URLSearchParams({ limit: String(options?.limit ?? 50) });

            if (options?.cursor) {
                params.set('cursor', options.cursor);
            }

            if (options?.minPriority !== undefined) {
                params.set('minPriority', String(options.minPriority));
            }

            if (options?.tags && options.tags.length > 0) {
                params.set('tags', options.tags.join(','));
            }

            return request<PaginatedResponse<Message>>(
                `/topics/${encodeURIComponent(topicName)}/messages?${params.toString()}`,
            );
        },

        listMyPushTokens() {
            return request<PushToken[]>('/push-tokens');
        },

        listSubscriptionMessages(
            deviceId?: string,
            options?: { cursor?: string; limit?: number; topicName?: string } & MessageFilterParams,
        ) {
            const params = new URLSearchParams();

            if (deviceId) {
                params.set('deviceId', deviceId);
            }

            if (options?.cursor) {
                params.set('cursor', options.cursor);
            }

            if (options?.limit !== undefined) {
                params.set('limit', String(options.limit));
            }

            if (options?.topicName) {
                params.set('topicName', options.topicName);
            }

            if (options?.minPriority !== undefined) {
                params.set('minPriority', String(options.minPriority));
            }

            if (options?.tags && options.tags.length > 0) {
                params.set('tags', options.tags.join(','));
            }

            const query = params.toString();

            return request<PaginatedResponse<Message>>(
                `/subscriptions/messages${query ? `?${query}` : ''}`,
            );
        },

        listSubscriptionMetrics(deviceId?: string) {
            const query = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
            return request<SubscriptionMetricsMap>(`/subscriptions/metrics${query}`);
        },

        listSubscriptions(deviceId?: string) {
            const query = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
            return request<Subscription[]>(`/subscriptions${query}`);
        },

        listTopics(query?: string) {
            const queryString = query ? `?q=${encodeURIComponent(query)}` : '';
            return request<Topic[]>(`/topics${queryString}`);
        },

        listWebhookDeliveries(webhookId: string, limit = 50) {
            return request<WebhookDelivery[]>(
                `/webhooks/${encodeURIComponent(webhookId)}/deliveries?limit=${limit}`,
            );
        },

        listWebhooks() {
            return request<Webhook[]>('/webhooks');
        },

        publish(
            topicName: string,
            payload: {
                body: string;
                priority: number;
                tags: string[];
                title: string;
            },
        ) {
            return request<{ message: string; messageId: string }>(
                `/topic/${encodeURIComponent(topicName)}`,
                {
                    body: JSON.stringify(payload),
                    method: 'POST',
                },
            );
        },

        purgeSignals() {
            return request<{ status: string }>('/me/signals', { method: 'DELETE' });
        },

        registerPushToken(input: {
            deviceId: string;
            platform: 'android' | 'ios' | 'web';
            token: string;
        }) {
            return request<{ id: string }>('/push-tokens', {
                body: JSON.stringify(input),
                method: 'POST',
            });
        },

        releaseTopic(name: string) {
            return request<Topic>(`/topics/${encodeURIComponent(name)}/claim`, {
                method: 'DELETE',
            });
        },

        subscribe(
            deviceId: string,
            topicName: string,
            pushEnabled = true,
            settings?: Partial<SubscriptionSettings>,
        ) {
            return request<{ id: string; topic: Topic }>('/subscriptions', {
                body: JSON.stringify({ deviceId, pushEnabled, settings, topicName }),
                method: 'POST',
            });
        },

        unsubscribe(deviceId: string, topicName: string) {
            return request<{ ok: boolean }>('/subscriptions', {
                body: JSON.stringify({ deviceId, topicName }),
                method: 'DELETE',
            });
        },

        updatePushToken(id: string, pushEnabled: boolean) {
            return request<PushToken>(`/push-tokens/${id}`, {
                body: JSON.stringify({ pushEnabled }),
                method: 'PATCH',
            });
        },

        updateSubscription(
            id: string,
            body: {
                deviceId?: string;
                pushEnabled?: boolean;
                settings?: Partial<SubscriptionSettings>;
            },
        ) {
            return request<Subscription>(`/subscriptions/${id}`, {
                body: JSON.stringify(body),
                method: 'PATCH',
            });
        },

        updateTopic(
            name: string,
            input: { accessMode?: AccessMode; description?: string; displayName?: string },
        ) {
            return request<Topic>(`/topics/${encodeURIComponent(name)}`, {
                body: JSON.stringify(input),
                method: 'PATCH',
            });
        },

        updateWebhook(
            id: string,
            input: { name?: string; status?: string; template?: null | string; topicName?: string },
        ) {
            return request<Webhook>(`/webhooks/${encodeURIComponent(id)}`, {
                body: JSON.stringify(input),
                method: 'PATCH',
            });
        },
    };

    function sseMultiUrl(topics: string[], since?: number): string {
        const encodedTopics = topics.map((topic) => encodeURIComponent(topic)).join(',');
        const parameters = [
            encodedTopics ? `topics=${encodedTopics}` : '',
            since ? `since=${since}` : '',
        ].filter(Boolean);

        return `${baseUrl}/listen${parameters.length ? `?${parameters.join('&')}` : ''}`;
    }

    function sseUrl(topicName: string, since?: number): string {
        const sinceParameter = since ? `?since=${since}` : '';
        return `${baseUrl}/topics/${encodeURIComponent(topicName)}/listen${sinceParameter}`;
    }

    return { api, getAuthToken, setAuthToken, sseMultiUrl, sseUrl };
}
