// Identifiers and presentation metadata only; verification runs on the server.
export interface VerificationConfig {
    algorithm?: 'sha1' | 'sha256' | 'sha512';
    encoding?: 'base64' | 'hex';
    header: string;
    prefix?: string;
}

export type VerificationScheme = 'github' | 'hmac' | 'none' | 'stripe' | 'svix' | 'token';

export const VERIFICATION_LABELS: Record<VerificationScheme, string> = {
    github: 'GitHub (X-Hub-Signature-256)',
    hmac: 'Custom HMAC',
    none: 'None — anyone with the URL can post',
    stripe: 'Stripe (Stripe-Signature)',
    svix: 'Svix / Resend (svix-signature)',
    token: 'Shared token header',
};

export const VERIFICATION_SCHEMES: VerificationScheme[] = [
    'github',
    'hmac',
    'none',
    'stripe',
    'svix',
    'token',
];

export const VERIFICATION_HINTS: Record<VerificationScheme, string> = {
    github: 'Repository → Settings → Webhooks → Secret.',
    hmac: 'Pick the header, digest, and encoding your provider documents.',
    none: 'Deliveries are accepted from anyone who knows the endpoint URL.',
    stripe: 'Stripe Dashboard → Developers → Webhooks → Signing secret (whsec_…).',
    svix: 'Resend/Clerk dashboard → Webhooks → Signing secret (whsec_…).',
    token: 'The static token your provider sends in a header, compared verbatim.',
};

export function schemeNeedsConfig(scheme: VerificationScheme): boolean {
    return scheme === 'hmac' || scheme === 'token';
}

export const DEFAULT_VERIFICATION_BY_SOURCE: Record<string, VerificationScheme> = {
    custom: 'none',
    github: 'github',
    grafana: 'token',
    stripe: 'stripe',
    vercel: 'hmac',
};

export function defaultVerificationForSource(source: string): VerificationScheme {
    return DEFAULT_VERIFICATION_BY_SOURCE[source] ?? 'none';
}

export const DEFAULT_CONFIG_BY_SOURCE: Record<string, VerificationConfig> = {
    grafana: { header: 'authorization', prefix: 'Bearer ' },
    vercel: { algorithm: 'sha1', encoding: 'hex', header: 'x-vercel-signature' },
};
