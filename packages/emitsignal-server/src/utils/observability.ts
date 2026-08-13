/**
 * Paths hit by uptime probes and container health checks. They run every few
 * seconds forever, so tracing and access-logging them buries real traffic.
 */
const UNOBSERVED_PATHS = new Set(['/health']);

export function isUnobservedPath(path: string) {
    return UNOBSERVED_PATHS.has(path);
}
