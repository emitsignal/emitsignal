import { environment } from '#/schema/environment';

const PRIVATE_IP_PATTERNS = [
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
];

export type ServerLike = { requestIP?: (req: Request) => { address: string } | null } | null;

export function getClientIP(request: Request, server: ServerLike): string {
    const trustedHeader = environment.TRUSTED_PROXY_HEADER;

    if (trustedHeader !== 'none') {
        const forwarded = readForwardedAddress(request, trustedHeader);

        if (forwarded) {
            return forwarded;
        }
    }

    return server?.requestIP?.(request)?.address ?? 'unknown';
}

function isPrivateIP(ip: string): boolean {
    return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
}

function readForwardedAddress(request: Request, header: string): null | string {
    const raw = request.headers.get(header);

    if (!raw?.trim()) {
        return null;
    }

    if (header !== 'x-forwarded-for') {
        return raw.trim();
    }

    const addresses = raw
        .split(',')
        .map((address) => address.trim())
        .filter(Boolean);

    for (let index = addresses.length - 1; index >= 0; index -= 1) {
        if (!isPrivateIP(addresses[index])) {
            return addresses[index];
        }
    }

    return null;
}
