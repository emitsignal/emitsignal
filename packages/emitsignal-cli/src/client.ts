import { createApiClient } from '@emitsignal/shared';

import { getBaseUrl, getToken } from './config.ts';

export function createClient() {
    const client = createApiClient(getBaseUrl());
    const token = getToken();

    if (token) {
        client.setAuthToken(token);
    }

    return client;
}
