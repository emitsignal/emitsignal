import type { Sampler, SamplingResult } from '@opentelemetry/sdk-trace-node';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
    BatchSpanProcessor,
    NodeTracerProvider,
    ParentBasedSampler,
    SamplingDecision,
    TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import * as Sentry from '@sentry/bun';

import { environment } from '#/schema/environment';
import { isUnobservedPath, resolveServiceName } from '#/utils/observability';

import pkg from '../../package.json';

const ratioSampler = new TraceIdRatioBasedSampler(environment.OTEL_TRACES_SAMPLE_RATE);

const unobservedPathSampler: Sampler = {
    shouldSample(context, traceId, _spanName, _spanKind, attributes): SamplingResult {
        const path = attributes['url.path'];

        if (typeof path === 'string' && isUnobservedPath(path)) {
            return { decision: SamplingDecision.NOT_RECORD };
        }

        return ratioSampler.shouldSample(context, traceId);
    },
    toString: () => 'ObservabilitySampler',
};

const NOISY_SENTRY_INTEGRATIONS = new Set(['Postgres', 'PostgresJs', 'Prisma']);

if (environment.SENTRY_ENABLED && environment.SENTRY_DSN) {
    Sentry.init({
        dsn: environment.SENTRY_DSN,
        environment: Bun.env.NODE_ENV ?? 'development',
        integrations: (defaults) =>
            defaults.filter((integration) => !NOISY_SENTRY_INTEGRATIONS.has(integration.name)),
        skipOpenTelemetrySetup: true,
        tracesSampleRate: 1.0,
    });
}

let tracerProvider: NodeTracerProvider | undefined;

if (environment.OTEL_ENABLED) {
    tracerProvider = new NodeTracerProvider({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: resolveServiceName(Bun.argv, {
                serviceName: environment.OTEL_SERVICE_NAME,
                workerServiceName: environment.OTEL_WORKER_SERVICE_NAME,
            }),
            [ATTR_SERVICE_VERSION]: pkg.version,
            'deployment.environment': Bun.env.NODE_ENV ?? 'development',
        }),
        sampler: new ParentBasedSampler({ root: unobservedPathSampler }),
        spanProcessors: [
            new BatchSpanProcessor(
                new OTLPTraceExporter({
                    url: `${Bun.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318'}/v1/traces`,
                }),
            ),
        ],
    });

    tracerProvider.register();
}

// BatchSpanProcessor holds finished spans in memory until its export interval.
// Without this the buffer dies with the process on every deploy, taking the
// traces of whatever happened just before the restart with it.
export async function shutdownTelemetry(): Promise<void> {
    await tracerProvider?.shutdown();
}
