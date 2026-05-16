import { jwtVerify, SignJWT } from 'jose';

import { environment } from '../schema/environment';

const secret = new TextEncoder().encode(environment.JWT_SECRET);

const alg = 'HS256';

export async function signToken(userId: string): Promise<string> {
    return new SignJWT({ sub: userId })
        .setProtectedHeader({ alg })
        .setExpirationTime('30d')
        .sign(secret);
}

export async function verifyToken(token: string): Promise<null | string> {
    try {
        const { payload } = await jwtVerify(token, secret, { algorithms: [alg] });

        return (payload.sub as string) ?? null;
    } catch {
        return null;
    }
}
