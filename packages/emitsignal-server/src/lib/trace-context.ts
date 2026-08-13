import { context, propagation } from '@opentelemetry/api';

export type TraceCarrier = Record<string, string>;

export type Traced<TJob> = { traceContext?: TraceCarrier } & TJob;

// Jobs cross a process boundary through Redis, where no ambient context
// survives, so the W3C trace headers have to ride inside the payload itself.
// Without this the worker span opens a brand new trace and the publish that
// caused it is nowhere to be found.
export function captureTraceContext(): TraceCarrier | undefined {
    const carrier: TraceCarrier = {};

    propagation.inject(context.active(), carrier);

    if (Object.keys(carrier).length === 0) {
        return undefined;
    }

    return carrier;
}

export function traceContextFrom(carrier: TraceCarrier | undefined) {
    if (!carrier) {
        return context.active();
    }

    return propagation.extract(context.active(), carrier);
}
