import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { argv } from 'bun';

import pkg from '../../package.json';
import { environment } from '../schema/environment';

const [, scriptName] = argv;

if (environment.OTEL_ENABLED) {
    const provider = new NodeTracerProvider({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: scriptName.endsWith('workers/all.ts')
                ? environment.OTEL_WORKER_SERVICE_NAME
                : environment.OTEL_SERVICE_NAME,
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
