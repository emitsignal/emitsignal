import type {
    TestMessage,
    TestSession,
    TestSubscription,
    TestTopic,
    TestTopicSuggestion,
    TestTopicWithCounts,
} from './types';

const SERVER_URL = 'http://localhost:5001';

let authToken: null | string = null;

export function setAuthToken(token: null | string): void {
    authToken = token;
}

export async function waitForServer(retries = 30): Promise<void> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(`${SERVER_URL}/`);
            if (res.ok) {
                await fetch(`${SERVER_URL}/topics`);
                return;
            }
        } catch {
            // server not ready yet
        }
        await new Promise((response) => setTimeout(response, 1000));
    }
    throw new Error(`Server not ready after ${retries} retries`);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((init.headers ?? {}) as Record<string, string>),
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${SERVER_URL}${path}`, { ...init, headers });

    if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw new Error(`API ${init.method ?? 'GET'} ${path} failed: ${response.status} ${text}`);
    }

    return response.json() as Promise<T>;
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

    getMessage(id: string) {
        return request<TestMessage>(`/messages/${encodeURIComponent(id)}`);
    },

    getSuggestions(deviceId?: string) {
        const query = deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : '';
        return request<TestTopicSuggestion[]>(`/suggestions${query}`);
    },

    getTopic(name: string) {
        return request<TestTopicWithCounts>(`/topics/${encodeURIComponent(name)}`);
    },

    listMessages(topicName: string, limit = 50) {
        return request<TestMessage[]>(
            `/topics/${encodeURIComponent(topicName)}/messages?limit=${limit}`,
        );
    },

    listSubscriptions(deviceId: string) {
        return request<TestSubscription[]>(
            `/subscriptions?deviceId=${encodeURIComponent(deviceId)}`,
        );
    },

    listTopics(query?: string) {
        const qs = query ? `?q=${encodeURIComponent(query)}` : '';
        return request<TestTopic[]>(`/topics${qs}`);
    },

    me() {
        return request<{ user: { email: string; id: string; name: null | string } }>('/auth/me');
    },

    publish(
        topicName: string,
        payload: {
            actions?: { label?: string; type: 'acknowledge' | 'view'; url?: string }[];
            body: string;
            priority: number;
            tags: string[];
            title: string;
        },
    ) {
        return request<{ message: string; messageId: string }>(
            `/publish/${encodeURIComponent(topicName)}`,
            {
                body: JSON.stringify(payload),
                method: 'POST',
            },
        );
    },

    requestMagicLink(email: string) {
        return request<{ devCode?: string; expiresAt: number; ok: boolean }>('/auth/magic-link', {
            body: JSON.stringify({ email }),
            method: 'POST',
        });
    },

    subscribe(deviceId: string, topicName: string, pushEnabled = true) {
        return request<{ id: string; topic: TestTopic }>('/subscriptions', {
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

    verifyMagicLink(email: string, code: string) {
        return request<TestSession>('/auth/verify', {
            body: JSON.stringify({ code, email }),
            method: 'POST',
        });
    },
};

export async function createSession(email: string): Promise<TestSession> {
    await waitForServer();
    const { devCode } = await api.requestMagicLink(email);
    if (!devCode) throw new Error('devCode not returned — is NODE_ENV=development?');
    const session = await api.verifyMagicLink(email, devCode);
    setAuthToken(session.token);
    return session;
}
