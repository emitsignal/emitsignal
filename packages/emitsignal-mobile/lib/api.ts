// SSE handled separately by hooks/use-sse.ts.

import { createApiClient } from '@emitsignal/shared/api';

export * from '@emitsignal/shared/api';

export const API_URL =
    process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:5001';

export const { api, setAuthToken, sseMultiUrl, sseUrl } = createApiClient(API_URL);
