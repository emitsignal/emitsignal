import type { TransportTargetOptions } from 'pino';

export type LogIngestionProvider = 'betterstack' | 'stdout';

interface LogIngestionConfig {
    host?: string;
    provider: LogIngestionProvider;
    token?: string;
}

const UNOBSERVED_PATHS = new Set(['/health']);

const DEFAULT_INGESTION_HOSTS: Record<Exclude<LogIngestionProvider, 'stdout'>, string> = {
    betterstack: 'https://in.logs.betterstack.com',
};

export function isUnobservedPath(path: string) {
    return UNOBSERVED_PATHS.has(path);
}

export function resolveLogIngestionTarget({
    host,
    provider,
    token,
}: LogIngestionConfig): TransportTargetOptions | undefined {
    if (provider === 'stdout' || !token) {
        return undefined;
    }

    return {
        options: {
            options: { endpoint: host ?? DEFAULT_INGESTION_HOSTS[provider] },
            sourceToken: token,
        },
        target: '@logtail/pino',
    };
}

export function resolveServiceName(
    argv: string[],
    names: { serviceName: string; workerServiceName: string },
) {
    const isWorkerProcess = argv.some((argument) => argument.includes('/workers/'));

    if (isWorkerProcess) {
        return names.workerServiceName;
    }

    return names.serviceName;
}
