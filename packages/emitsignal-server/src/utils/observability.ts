/**
 * Paths hit by uptime probes and container health checks. They run every few
 * seconds forever, so tracing and access-logging them buries real traffic.
 */
const UNOBSERVED_PATHS = new Set(['/health']);

export function isUnobservedPath(path: string) {
    return UNOBSERVED_PATHS.has(path);
}

// The telemetry SDK is preloaded (bunfig.toml) and so runs before the entry
// module, leaving argv as the only signal of which process it is booting.
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
