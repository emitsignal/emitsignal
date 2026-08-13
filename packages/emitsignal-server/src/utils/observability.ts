const UNOBSERVED_PATHS = new Set(['/health']);

export function isUnobservedPath(path: string) {
    return UNOBSERVED_PATHS.has(path);
}

// The SDK preloads before the entry module, leaving argv as the only signal.
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
