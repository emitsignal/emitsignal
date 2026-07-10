import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import * as Sentry from '@sentry/bun';

import pkg from '../../package.json';
import { environment } from '../schema/environment';

if (environment.SENTRY_ENABLED && environment.SENTRY_DSN) {
    Sentry.init({
        dsn: environment.SENTRY_DSN,
        environment: Bun.env.NODE_ENV ?? 'development',
        skipOpenTelemetrySetup: true,
        tracesSampleRate: 1.0,
    });
}

if (environment.OTEL_ENABLED) {
    const provider = new NodeTracerProvider({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: environment.OTEL_SERVICE_NAME,
            [ATTR_SERVICE_VERSION]: pkg.version,
            'deployment.environment': Bun.env.NODE_ENV ?? 'development',
        }),
        spanProcessors: [
            new BatchSpanProcessor(
                new OTLPTraceExporter({
                    url: `${Bun.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318'}/v1/traces`,
                }),
            ),
        ],
    });

    provider.register();
}
