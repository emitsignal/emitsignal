import { auth } from '../../lib/auth';

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

    const session = await auth.api.getSession({ headers: webHeaders });

    return session?.user.id ?? null;
}
