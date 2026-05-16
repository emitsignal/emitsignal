import { verifyToken } from '../../lib/jwt';

export async function resolveUserId({
    headers,
}: {
    headers: Record<string, string | undefined>;
}): Promise<null | string> {
    const token = extractBearerToken(headers);

    if (!token) {
        return null;
    }

    return verifyToken(token);
}

function extractBearerToken(headers: Record<string, string | undefined>): null | string {
    const authorization = (headers.authorization || '').trim();

    if (!authorization) {
        return null;
    }

    const [, token] = authorization.split(' ');

    return token || null;
}
