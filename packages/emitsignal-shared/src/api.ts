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

export function createApiClient(baseUrl: string) {
    let authToken: null | string = null;

    function setAuthToken(token: null | string): void {
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

        const response = await fetch(`${baseUrl}${path}`, { ...init, headers });

        if (!response.ok) {
            const text = await response.text().catch(() => response.statusText);
            throw new Error(`${response.status} ${text}`);
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

        listMessages(topicName: string, limit = 50) {
            return request<Message[]>(
                `/topics/${encodeURIComponent(topicName)}/messages?limit=${limit}`,
            );
        },

        listMyPushTokens() {
            return request<PushToken[]>('/push-tokens');
        },

        listSubscriptions(deviceId: string) {
            return request<Subscription[]>(
                `/subscriptions?deviceId=${encodeURIComponent(deviceId)}`,
            );
        },

        listTopics(query?: string) {
            const queryString = query ? `?q=${encodeURIComponent(query)}` : '';
            return request<Topic[]>(`/topics${queryString}`);
        },

        me() {
            return request<{ user: { email: string; id: string; name: null | string } }>(
                '/auth/me',
            );
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
            return request<{ devCode?: string; expiresAt: number; ok: boolean }>(
                '/auth/magic-link',
                {
                    body: JSON.stringify({ email }),
                    method: 'POST',
                },
            );
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

    function sseMultiUrl(topics: string[]): string {
        const encodedTopics = topics.map((topic) => encodeURIComponent(topic)).join(',');
        return `${baseUrl}/listen${encodedTopics ? `?topics=${encodedTopics}` : ''}`;
    }

    function sseUrl(topicName: string, since?: number): string {
        const sinceParameter = since ? `?since=${since}` : '';
        return `${baseUrl}/topics/${encodeURIComponent(topicName)}/listen${sinceParameter}`;
    }

    return { api, setAuthToken, sseMultiUrl, sseUrl };
}
