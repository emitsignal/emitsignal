import Elysia from 'elysia';

export const health = new Elysia().get('/health', () => ({
    status: 'ok' as const,
    uptime: Math.round(process.uptime()),
}));
