import { APP_STORE_URL, REPO_URL } from '#/lib/links';

export const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://emitsignal.com';
export const SITE_NAME = 'EmitSignal';

export const DEFAULT_DESCRIPTION =
    'Publish to any topic with a single HTTP request, then read it on your phone, in your terminal, or in your inbox. Open source, with iOS and Android apps.';
export const DEFAULT_TITLE = 'EmitSignal: push notifications with one curl';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

type MetaTag = Record<string, string>;

interface SeoOptions {
    description?: string;
    image?: string;
    noindex?: boolean;
    path: string;
    title?: string;
    type?: 'article' | 'website';
}

export function absoluteUrl(path: string): string {
    return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}

export function buildSeoMeta({
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_OG_IMAGE,
    noindex = false,
    path,
    title = DEFAULT_TITLE,
    type = 'website',
}: SeoOptions): { links: MetaTag[]; meta: MetaTag[] } {
    const url = absoluteUrl(path);

    const meta: MetaTag[] = [
        { title },
        { content: description, name: 'description' },
        { content: SITE_NAME, property: 'og:site_name' },
        { content: 'en_US', property: 'og:locale' },
        { content: title, property: 'og:title' },
        { content: description, property: 'og:description' },
        { content: url, property: 'og:url' },
        { content: type, property: 'og:type' },
        { content: image, property: 'og:image' },
        { content: 'summary_large_image', name: 'twitter:card' },
        { content: title, name: 'twitter:title' },
        { content: description, name: 'twitter:description' },
        { content: image, name: 'twitter:image' },
    ];

    if (noindex) {
        meta.push({ content: 'noindex, nofollow', name: 'robots' });
    }

    return {
        // Links are not deduplicated across matched routes, so a canonical from a
        // parent route would render alongside the child's. Only leaf routes call this.
        links: noindex ? [] : [{ href: url, rel: 'canonical' }],
        meta,
    };
}

export function jsonLdScript(schema: Record<string, unknown>): {
    children: string;
    type: string;
} {
    return {
        // Closing-tag sequences inside JSON would terminate the script element early.
        children: JSON.stringify(schema).replace(/</g, '\\u003c'),
        type: 'application/ld+json',
    };
}

export const ORGANIZATION_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    description:
        'EmitSignal is a real-time notification platform. Publish a message to a named topic over HTTP and receive it on your phone, terminal, or inbox.',
    logo: `${SITE_URL}/logo512.png`,
    name: SITE_NAME,
    sameAs: [REPO_URL, APP_STORE_URL],
    url: SITE_URL,
};

export const WEBSITE_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    publisher: { '@id': SITE_URL, '@type': 'Organization', name: SITE_NAME },
    url: SITE_URL,
};

export function breadcrumbSchema(items: { name: string; path: string }[]): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            item: absoluteUrl(item.path),
            name: item.name,
            position: index + 1,
        })),
    };
}
