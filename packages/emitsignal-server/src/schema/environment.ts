import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const environmentSchema = Type.Object({
    API_URL: Type.String({ default: 'http://localhost:5001' }),
    APP_URL: Type.String({ default: 'http://localhost:5002' }),

    BETTER_AUTH_SECRET: Type.String({ default: 'emitsignal-dev-better-auth-secret-32chars!!' }),
    BETTER_AUTH_URL: Type.String({ default: 'http://localhost:5001' }),

    EMAIL_FROM: Type.String({ default: 'EmitSignal <noreply@emitsignal.com>' }),
    EMAIL_PROVIDER: Type.Union(
        [Type.Literal('log'), Type.Literal('smtp'), Type.Literal('resend')],
        {
            default: 'log',
        },
    ),
    EMIT_SIGNAL_HTTP_PORT: Type.Number({ default: 3333 }),

    FILE_STORAGE_PROVIDER: Type.Union([Type.Literal('local'), Type.Literal('s3')], {
        default: 'local',
    }),

    GITHUB_CLIENT_ID: Type.Optional(Type.String()),
    GITHUB_CLIENT_SECRET: Type.Optional(Type.String()),

    OTEL_ENABLED: Type.Boolean({ default: false }),
    OTEL_EXPORTER_OTLP_ENDPOINT: Type.Optional(Type.String()),
    OTEL_SERVICE_NAME: Type.String({ default: 'emitsignal-server' }),
    OTEL_VERBOSE_LOG: Type.Boolean({ default: false }),
    OTEL_WORKER_SERVICE_NAME: Type.String({ default: 'emitsignal-worker' }),

    REDIS_URL: Type.String({ default: 'redis://localhost:6379' }),

    RESEND_API_KEY: Type.Optional(Type.String()),

    S3_ACCESS_KEY_ID: Type.Optional(Type.String()),
    S3_BUCKET_NAME: Type.Optional(Type.String()),

    S3_ENDPOINT: Type.Optional(Type.String()),
    S3_FORCE_PATH_STYLE: Type.Optional(Type.Boolean()),
    S3_PUBLIC_URL_BASE: Type.Optional(Type.String()),
    S3_REGION: Type.Optional(Type.String()),
    S3_SECRET_ACCESS_KEY: Type.Optional(Type.String()),

    SENTRY_DSN: Type.String(),
    SENTRY_ENABLED: Type.Boolean({ default: true }),

    SMTP_HOST: Type.String({ default: 'localhost' }),
    SMTP_PASS: Type.Optional(Type.String()),
    SMTP_PORT: Type.Number({ default: 1025 }),
    SMTP_USER: Type.Optional(Type.String()),

    UPLOAD_DIR: Type.String({ default: './uploads' }),
});

export type Environment = typeof environment;

export const environment = Value.Parse(environmentSchema, Bun.env);
