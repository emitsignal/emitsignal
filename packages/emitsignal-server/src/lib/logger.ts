import type { TransportTargetOptions } from 'pino';

import { trace } from '@opentelemetry/api';
import { hostname } from 'node:os';
import pino from 'pino';

import { environment, isProduction } from '#/schema/environment';
import { resolveLogIngestionTarget, resolveServiceName } from '#/utils/observability';

const service = resolveServiceName(Bun.argv, {
    serviceName: environment.OTEL_SERVICE_NAME,
    workerServiceName: environment.OTEL_WORKER_SERVICE_NAME,
});

const ingestionTarget = resolveLogIngestionTarget({
    host: environment.LOG_INGESTION_HOST,
    provider: environment.LOG_INGESTION_PROVIDER,
    token: environment.LOG_INGESTION_TOKEN,
});

const localTarget: TransportTargetOptions = isProduction
    ? { options: { destination: 1 }, target: 'pino/file' }
    : {
          options: {
              colorize: true,
              ignore: 'pid,hostname,service',
              translateTime: 'HH:MM:ss.l',
          },
          target: 'pino-pretty',
      };

export const logger = pino({
    base: { hostname: hostname(), pid: process.pid, service },
    level: environment.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
    mixin() {
        if (!environment.OTEL_ENABLED || !environment.OTEL_VERBOSE_LOG) {
            return {};
        }

        const span = trace.getActiveSpan();

        if (!span?.isRecording()) {
            return {};
        }

        const { spanId, traceId } = span.spanContext();

        return { span_id: spanId, trace_id: traceId };
    },
    // Backstop for the whole process: log records leave the box when an ingestion
    // provider is configured, and these field names are the ones that carry a
    // direct identifier (recipient address, rate-limit key = ip or ip:email).
    redact: { censor: '[redacted]', paths: ['email', 'key', 'to', '*.email', '*.to'] },
    transport: { targets: ingestionTarget ? [localTarget, ingestionTarget] : [localTarget] },
    ...(isProduction ? {} : { msgPrefix: '[EmitSignal] ' }),
});

export async function flushLogs(): Promise<void> {
    await new Promise<void>((resolve) => {
        logger.flush(() => resolve());
    });
}
