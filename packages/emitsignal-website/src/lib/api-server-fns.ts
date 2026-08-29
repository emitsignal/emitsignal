import type { SharedMessage, Webhook } from '@emitsignal/shared/api';
import type { BillingInfo } from '@emitsignal/shared/billing';

import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';

import type { ApiKey } from '#/hooks/use-api-keys';

import { API_URL } from '#/lib/api';
import { signedOgUrl } from '#/lib/og-signature';
import { SITE_URL } from '#/lib/seo';

export interface SessionResponse {
    user: {
        email: string;
        id: string;
        image?: null | string;
        name?: null | string;
        onboarded?: boolean;
    };
}

export type SharedMessagePage = { ogImage: string } & SharedMessage;

async function authedGet<TResponse>(path: string): Promise<TResponse> {
    const apiUrl = process.env.API_URL ?? API_URL;
    const cookie = getRequestHeader('cookie') ?? '';

    const response = await fetch(`${apiUrl}${path}`, {
        headers: { cookie },
    });

    if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw new Error(`${response.status} ${text}`);
    }

    return response.json() as Promise<TResponse>;
}

export const fetchSharedMessageServer = createServerFn()
    .validator((shareId: string) => shareId)
    .handler(async ({ data: shareId }): Promise<null | SharedMessagePage> => {
        const apiUrl = process.env.API_URL ?? API_URL;

        const response = await fetch(`${apiUrl}/share/${encodeURIComponent(shareId)}`);

        if (!response.ok) {
            return null;
        }

        const shared = (await response.json()) as SharedMessage;

        const ogImage = signedOgUrl(SITE_URL, {
            date: new Date(shared.message.createdAt).toISOString().slice(0, 10),
            description: shared.message.body.slice(0, 200),
            priority: String(shared.message.priority),
            tags: shared.message.tags.join(','),
            template: 'signal',
            title: shared.message.title,
            topic: shared.topic.name,
        });

        return { ...shared, ogImage };
    });

export const fetchBillingServer = createServerFn().handler(() =>
    authedGet<BillingInfo>('/billing'),
);

export const fetchSessionServer = createServerFn().handler(async () => {
    const data = await authedGet<null | SessionResponse>('/api/auth/get-session');

    // Return only the fields the sidebar footer needs so the payload stays
    // serializable; the client query refreshes the full session after hydration.
    return data?.user ? { user: data.user } : null;
});

export const fetchWebhooksServer = createServerFn().handler(() =>
    authedGet<Webhook[]>('/webhooks'),
);

export const fetchApiKeysServer = createServerFn().handler(async () => {
    const { apiKeys } = await authedGet<{ apiKeys: ApiKey[] }>('/api/auth/api-key/list');

    return apiKeys ?? [];
});
