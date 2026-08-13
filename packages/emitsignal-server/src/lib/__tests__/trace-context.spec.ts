import { context, trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { beforeAll, describe, expect, it } from 'bun:test';

import { captureTraceContext, traceContextFrom } from '../trace-context';

describe('trace context propagation', () => {
    beforeAll(() => {
        // register() installs the W3C propagator and context manager the same way
        // instrumentation.ts does; without it inject/extract are no-ops.
        new NodeTracerProvider().register();
    });

    it('carries the active trace across a job payload', () => {
        const tracer = trace.getTracer('test');
        const parent = tracer.startSpan('publish');

        const carrier = context.with(trace.setSpan(context.active(), parent), () =>
            captureTraceContext(),
        );

        expect(carrier).toBeDefined();
        expect(carrier?.traceparent).toContain(parent.spanContext().traceId);

        const restored = trace.getSpan(traceContextFrom(carrier));

        expect(restored?.spanContext().traceId).toBe(parent.spanContext().traceId);
        expect(restored?.spanContext().spanId).toBe(parent.spanContext().spanId);
    });

    it('falls back to the ambient context when a job carries none', () => {
        expect(traceContextFrom(undefined)).toBe(context.active());
    });

    it('captures nothing when no span is active', () => {
        expect(captureTraceContext()).toBeUndefined();
    });
});
