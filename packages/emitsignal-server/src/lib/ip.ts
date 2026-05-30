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
    // Cloudflare — cf-connecting-ip is always the real client IP,
    // cannot be spoofed (set by Cloudflare's edge, not the client)
    const cfIP = request.headers.get('cf-connecting-ip');
    if (cfIP?.trim()) {
        return cfIP.trim();
    }

    // x-real-ip — set by Nginx's `proxy_set_header X-Real-IP $remote_addr`
    // Not the client, so trustworthy if you control the proxy
    const realIP = request.headers.get('x-real-ip');
    if (realIP?.trim()) {
        return realIP.trim();
    }

    // x-forwarded-for — read LEFT to right, skip private/loopback IPs.
    const forwarded = request.headers.get('x-forwarded-for');

    if (forwarded) {
        const ips = forwarded
            .split(',')
            .map((ip) => ip.trim())
            .filter(Boolean);

        for (const ip of ips) {
            if (!isPrivateIP(ip)) {
                return ip;
            }
        }
    }

    // Bun native — actual TCP connection address, ground truth
    // Only bypassed if running behind a proxy (which is why it's the last resort)
    return server?.requestIP?.(request)?.address ?? 'unknown';
}

function isPrivateIP(ip: string): boolean {
    return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(ip));
}
