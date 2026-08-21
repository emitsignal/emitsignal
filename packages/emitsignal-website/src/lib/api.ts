// SSE handled separately by hooks/use-sse.ts.

import { createApiClient } from '@emitsignal/shared/api';

export * from '@emitsignal/shared/api';
export * from '@emitsignal/shared/message-filters';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';
export const API_URL_CLEAN = new URL(API_URL).host;

export const PUBLISH_BASE_URL = import.meta.env.VITE_PUBLISH_BASE_URL ?? API_URL;
export const PUBLISH_BASE_URL_CLEAN = new URL(PUBLISH_BASE_URL).host;

export const { api, setAuthToken, sseMultiUrl, sseUrl } = createApiClient(API_URL);
