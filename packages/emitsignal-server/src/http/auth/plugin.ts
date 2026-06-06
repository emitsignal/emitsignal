import { auth } from '../../lib/auth';

const SESSION_COOKIE = 'better-auth.session_token';

export async function resolveUserId({
    headers,
}: {
    headers: Record<string, string | undefined>;
}): Promise<null | string> {
    const webHeaders = new Headers();

    for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined) {
            webHeaders.set(key, value);
        }
    }

    // Try cookie-based session (web browsers)
    const session = await auth.api.getSession({ headers: webHeaders });

    if (session?.user.id) {
        return session.user.id;
    }

    // Try Bearer token as session token (mobile / non-browser clients)
    const authorization = webHeaders.get('authorization');

    if (authorization?.startsWith('Bearer ')) {
        const token = authorization.slice(7);
        const bearerHeaders = new Headers(webHeaders);

        const existing = bearerHeaders.get('cookie') ?? '';
        const sessionCookie = `${SESSION_COOKIE}=${token}`;

        bearerHeaders.set('cookie', existing ? `${existing}; ${sessionCookie}` : sessionCookie);

        const mobileSession = await auth.api.getSession({ headers: bearerHeaders });

        if (mobileSession?.user.id) {
            return mobileSession.user.id;
        }
    }

    return null;
}
