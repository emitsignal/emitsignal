// Whinsper REST client. Hits the Bun/Elysia backend.
// SSE handled separately by hooks/use-sse.ts.

const API_URL =
    process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";

export interface Topic {
    id: string;
    name: string;
    displayName: string;
    description?: string | null;
    isPublic: boolean;
    createdAt: number;
}

export interface TopicWithCounts extends Topic {
    messageCount: number;
    subscriberCount: number;
}

export interface Message {
    id: string;
    topicId: string;
    title: string;
    body: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    createdAt: number;
}

export interface Subscription {
    id: string;
    pushEnabled: boolean;
    createdAt: number;
    topic: Topic;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init.headers ?? {}),
        },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`${res.status} ${text}`);
    }
    return res.json() as Promise<T>;
}

export const api = {
    baseUrl: API_URL,

    listTopics(query?: string) {
        const q = query ? `?q=${encodeURIComponent(query)}` : "";
        return request<Topic[]>(`/topics${q}`);
    },

    getTopic(name: string) {
        return request<TopicWithCounts>(`/topics/${encodeURIComponent(name)}`);
    },

    listMessages(topicName: string, limit = 50) {
        return request<Message[]>(
            `/topics/${encodeURIComponent(topicName)}/messages?limit=${limit}`,
        );
    },

    publish(topicName: string, payload: {
        title: string;
        body: string;
        priority: number;
        tags: string[];
    }) {
        return request<{ message: string; messageId: string }>(
            `/topic/${encodeURIComponent(topicName)}`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            },
        );
    },

    listSubscriptions(deviceId: string) {
        return request<Subscription[]>(
            `/subscriptions?deviceId=${encodeURIComponent(deviceId)}`,
        );
    },

    subscribe(deviceId: string, topicName: string, pushEnabled = true) {
        return request<{ id: string; topic: Topic }>("/subscriptions", {
            method: "POST",
            body: JSON.stringify({ deviceId, topicName, pushEnabled }),
        });
    },

    unsubscribe(deviceId: string, topicName: string) {
        return request<{ ok: boolean }>("/subscriptions", {
            method: "DELETE",
            body: JSON.stringify({ deviceId, topicName }),
        });
    },

    registerPushToken(input: {
        deviceId: string;
        token: string;
        platform: "ios" | "android" | "web";
    }) {
        return request<{ id: string }>("/push-tokens", {
            method: "POST",
            body: JSON.stringify(input),
        });
    },

    requestMagicLink(email: string) {
        return request<{ ok: boolean; expiresAt: number; devCode?: string }>(
            "/auth/magic-link",
            {
                method: "POST",
                body: JSON.stringify({ email }),
            },
        );
    },

    verifyMagicLink(email: string, code: string) {
        return request<{
            token: string;
            expiresAt: number;
            user: { id: string; email: string; name: string | null };
        }>("/auth/verify", {
            method: "POST",
            body: JSON.stringify({ email, code }),
        });
    },

    me(token: string) {
        return request<{ user: { id: string; email: string; name: string | null } }>(
            "/auth/me",
            {
                headers: { Authorization: `Bearer ${token}` },
            },
        );
    },
};

export function sseUrl(topicName: string, since?: number): string {
    const sinceParam = since ? `?since=${since}` : "";
    return `${API_URL}/topics/${encodeURIComponent(topicName)}/listen${sinceParam}`;
}

export function sseMultiUrl(topics: string[]): string {
    const param = topics.map((t) => encodeURIComponent(t)).join(",");
    return `${API_URL}/listen${param ? `?topics=${param}` : ""}`;
}
