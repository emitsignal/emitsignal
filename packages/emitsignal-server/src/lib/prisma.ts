import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '#/generated/prisma/client';
import { environment } from '#/schema/environment';

const tracer = trace.getTracer('emitsignal.prisma');

function createPrismaClient() {
    const adapter = new PrismaPg({ connectionString: Bun.env.DATABASE_URL });
    const client = new PrismaClient({ adapter });

    if (!environment.OTEL_ENABLED) {
        return client;
    }

    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, model, operation, query }) {
                    const span = tracer.startSpan(`prisma.${model}.${operation}`, {
                        attributes: {
                            'db.model': model,
                            'db.operation': operation,
                            'db.system': 'postgresql',
                        },
                        kind: SpanKind.CLIENT,
                    });

                    try {
                        return await query(args);
                    } catch (error) {
                        span.recordException(
                            error instanceof Error ? error : new Error(String(error)),
                        );

                        span.setStatus({ code: SpanStatusCode.ERROR });

                        throw error;
                    } finally {
                        span.end();
                    }
                },
            },
        },
    });
}

export const prisma = createPrismaClient();
