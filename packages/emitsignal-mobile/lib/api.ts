// SSE handled separately by hooks/use-sse.ts.

export const API_URL =
    process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:5001';

let authToken: null | string = null;

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

export interface Message {
    acknowledgmentCount: number;
    actions: Action[];
    attachments: Attachment[];
    body: string;
    createdAt: number;
    id: string;
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

export interface TopicSuggestion {
    description: null | string;
    displayName: string;
    name: string;
}

export interface TopicWithCounts extends Topic {
    messageCount: number;
    subscriberCount: number;
}

export function setAuthToken(token: null | string): void {
    authToken = token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((init.headers ?? {}) as Record<string, string>),
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(`${API_URL}${path}`, { ...init, headers });

    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);

        throw new Error(`${res.status} ${text}`);
    }

    return res.json() as Promise<T>;
}

export const api = {
    acknowledgeMessage(messageId: string, deviceId: string, userId?: null | string) {
        return request<{ acknowledged: boolean; count: number }>(
            `/messages/${encodeURIComponent(messageId)}/acknowledge`,
            {
                body: JSON.stringify({ deviceId, userId }),
                method: 'POST',
            },
        );
    },

    baseUrl: API_URL,

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

    listMessages(topicName: string, limit = 50) {
        return request<Message[]>(
            `/topics/${encodeURIComponent(topicName)}/messages?limit=${limit}`,
        );
    },

    listMyPushTokens() {
        return request<PushToken[]>('/push-tokens');
    },

    listSubscriptions(deviceId: string) {
        return request<Subscription[]>(`/subscriptions?deviceId=${encodeURIComponent(deviceId)}`);
    },

    listTopics(query?: string) {
        const q = query ? `?q=${encodeURIComponent(query)}` : '';
        return request<Topic[]>(`/topics${q}`);
    },

    me() {
        return request<{ user: { email: string; id: string; name: null | string } }>('/auth/me');
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

    requestMagicLink(email: string) {
        return request<{ devCode?: string; expiresAt: number; ok: boolean }>('/auth/magic-link', {
            body: JSON.stringify({ email }),
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

    verifyMagicLink(email: string, code: string) {
        return request<{
            token: string;
            user: { email: string; id: string; name: null | string };
        }>('/auth/verify', {
            body: JSON.stringify({ code, email }),
            method: 'POST',
        });
    },
};

export function sseMultiUrl(topics: string[]): string {
    const param = topics.map((topic) => encodeURIComponent(topic)).join(',');
    return `${API_URL}/listen${param ? `?topics=${param}` : ''}`;
}

export function sseUrl(topicName: string, since?: number): string {
    const sinceParam = since ? `?since=${since}` : '';
    return `${API_URL}/topics/${encodeURIComponent(topicName)}/listen${sinceParam}`;
}
