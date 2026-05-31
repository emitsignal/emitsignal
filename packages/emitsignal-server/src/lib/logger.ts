import { trace } from '@opentelemetry/api';
import pino from 'pino';

import { environment } from '../schema/environment';

const isProduction = Bun.env.NODE_ENV === 'production';

export const logger = pino({
    level: Bun.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
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
    ...(isProduction
        ? {}
        : {
              msgPrefix: '[EmitSignal] ',
              redact: { paths: isProduction ? ['code'] : [] },
              transport: {
                  options: {
                      colorize: true,
                      ignore: 'pid,hostname',
                      translateTime: 'HH:MM:ss.l',
                  },
                  target: 'pino-pretty',
              },
          }),
});
