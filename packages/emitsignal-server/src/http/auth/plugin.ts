import { auth } from '../../lib/auth';
import { sessionUserIdCache } from '../../lib/cache';

export async function resolveUserId({
    headers,
}: {
    headers: Record<string, string | undefined>;
}): Promise<null | string> {
    // Only the auth-bearing headers determine the session: the cookie (web),
    // the Authorization header (Bearer session tokens and es_live_ API keys)
    // and the secondary x-api-key header.
    const cacheKey = `${headers.cookie ?? ''}|${headers.authorization ?? ''}|${headers['x-api-key'] ?? ''}`;

    const cached = sessionUserIdCache.get(cacheKey);

    if (cached !== undefined) {
        return cached.userId;
    }

    const webHeaders = new Headers();

    for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined) {
            webHeaders.set(key, value);
        }
    }

    const session = await auth.api.getSession({ headers: webHeaders });
    const userId = session?.user.id ?? null;

    sessionUserIdCache.set(cacheKey, { userId });

    return userId;
}
