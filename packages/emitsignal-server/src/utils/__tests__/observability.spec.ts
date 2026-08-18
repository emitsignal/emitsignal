import { describe, expect, it } from 'bun:test';

import { isUnobservedPath, resolveLogIngestionTarget, resolveServiceName } from '../observability';

describe('isUnobservedPath', () => {
    it('excludes the health check path', () => {
        expect(isUnobservedPath('/health')).toBe(true);
    });

    it('keeps every other path observed', () => {
        expect(isUnobservedPath('/')).toBe(false);
        expect(isUnobservedPath('/health/deep')).toBe(false);
        expect(isUnobservedPath('/topics/alerts/listen')).toBe(false);
    });
});

describe('resolveServiceName', () => {
    const names = { serviceName: 'emitsignal-server', workerServiceName: 'emitsignal-worker' };

    it('names the worker process from its entrypoint', () => {
        expect(resolveServiceName(['bun', '/app/src/workers/all.ts'], names)).toBe(
            'emitsignal-worker',
        );
        expect(resolveServiceName(['bun', 'run', '/app/src/workers/push.ts'], names)).toBe(
            'emitsignal-worker',
        );
    });

    it('names every other process as the server', () => {
        expect(resolveServiceName(['bun', '/app/src/index.ts'], names)).toBe('emitsignal-server');
        expect(resolveServiceName(['bun', 'test'], names)).toBe('emitsignal-server');
    });
});

describe('resolveLogIngestionTarget', () => {
    it('keeps logs on stdout when no provider is configured', () => {
        expect(
            resolveLogIngestionTarget({ enabled: true, provider: 'stdout', token: 'token' }),
        ).toBeUndefined();
    });

    it('keeps logs on stdout when the provider has no token', () => {
        expect(
            resolveLogIngestionTarget({ enabled: true, provider: 'betterstack' }),
        ).toBeUndefined();
    });

    it('keeps logs on stdout when ingestion is not enabled', () => {
        expect(
            resolveLogIngestionTarget({ provider: 'betterstack', token: 'token' }),
        ).toBeUndefined();
        expect(
            resolveLogIngestionTarget({ enabled: false, provider: 'betterstack', token: 'token' }),
        ).toBeUndefined();
    });

    it('builds the Better Stack transport with its default host', () => {
        expect(
            resolveLogIngestionTarget({ enabled: true, provider: 'betterstack', token: 'token' }),
        ).toEqual({
            options: {
                options: { endpoint: 'https://in.logs.betterstack.com' },
                sourceToken: 'token',
            },
            target: '@logtail/pino',
        });
    });

    it('prefers an explicitly configured ingesting host', () => {
        expect(
            resolveLogIngestionTarget({
                enabled: true,
                host: 'https://s123.eu-nbg-2.betterstackdata.com',
                provider: 'betterstack',
                token: 'token',
            }),
        ).toEqual({
            options: {
                options: { endpoint: 'https://s123.eu-nbg-2.betterstackdata.com' },
                sourceToken: 'token',
            },
            target: '@logtail/pino',
        });
    });
});
