import type { BillingInfo } from './billing.ts';

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
    topic: Topic;
}

export interface Topic {
    createdAt: number;
    description?: null | string;
    displayName: string;
    id: string;
    isPublic: boolean;
    name: string;
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

        const response = await fetch(`${baseUrl}${path}`, {
            credentials: 'include',
            ...init,
            headers,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => response.statusText);
            throw new Error(`${response.status} ${text}`);
        }

        if (response.status === 204) {
            return undefined as T;
        }

        return response.json() as Promise<T>;
    }

    const api = {
        acknowledgeMessage(messageId: string, deviceId: string, userId?: null | string) {
            return request<{ acknowledged: boolean; count: number }>(
                `/messages/${encodeURIComponent(messageId)}/acknowledge`,
                {
                    body: JSON.stringify({ deviceId, userId }),
                    method: 'POST',
                },
            );
        },

        baseUrl,

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

        listMessages(topicName: string, limit = 50) {
            return request<Message[]>(
                `/topics/${encodeURIComponent(topicName)}/messages?limit=${limit}`,
            );
        },

        listMyPushTokens() {
            return request<PushToken[]>('/push-tokens');
        },

        listSubscriptionMessages(deviceId?: string, limit?: number) {
            const params = new URLSearchParams();

            if (deviceId) {
                params.set('deviceId', deviceId);
            }

            if (limit !== undefined) {
                params.set('limit', String(limit));
            }

            const query = params.toString();

            return request<Message[]>(`/subscriptions/messages${query ? `?${query}` : ''}`);
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

        registerPushToken(input: {
            deviceId: string;
            platform: 'android' | 'ios' | 'web';
            token: string;
            userId?: null | string;
        }) {
            return request<{ id: string }>('/push-tokens', {
                body: JSON.stringify(input),
                method: 'POST',
            });
        },

        subscribe(deviceId: string, topicName: string, pushEnabled = true) {
            return request<{ id: string; topic: Topic }>('/subscriptions', {
                body: JSON.stringify({ deviceId, pushEnabled, topicName }),
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

    function sseMultiUrl(topics: string[]): string {
        const encodedTopics = topics.map((topic) => encodeURIComponent(topic)).join(',');
        return `${baseUrl}/listen${encodedTopics ? `?topics=${encodedTopics}` : ''}`;
    }

    function sseUrl(topicName: string, since?: number): string {
        const sinceParameter = since ? `?since=${since}` : '';
        return `${baseUrl}/topics/${encodeURIComponent(topicName)}/listen${sinceParameter}`;
    }

    return { api, getAuthToken, setAuthToken, sseMultiUrl, sseUrl };
}
