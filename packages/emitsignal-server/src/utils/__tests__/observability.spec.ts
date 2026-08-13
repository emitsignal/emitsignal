import { describe, expect, it } from 'bun:test';

import { isUnobservedPath, resolveServiceName } from '../observability';

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
