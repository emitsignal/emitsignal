import { context, propagation } from '@opentelemetry/api';

export type TraceCarrier = Record<string, string>;

export type Traced<TJob> = { traceContext?: TraceCarrier } & TJob;

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
