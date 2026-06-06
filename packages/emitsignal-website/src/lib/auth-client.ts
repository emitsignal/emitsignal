import { apiKeyClient } from '@better-auth/api-key/client';
import { passkeyClient } from '@better-auth/passkey/client';
import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

export const authClient = createAuthClient({
    baseURL,
    plugins: [emailOTPClient(), apiKeyClient(), passkeyClient()],
});
