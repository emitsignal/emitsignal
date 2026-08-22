import Elysia from 'elysia';

import { readMessageTotal } from '#/services/stats/message-counter';

export const stats = new Elysia().get('/stats', async () => ({
    messages: await readMessageTotal(),
}));
