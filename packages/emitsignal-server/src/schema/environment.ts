import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

// Dev/test-only fallback signing secret. It is intentionally NOT a valid
// production secret: the app refuses to boot in production unless
// BETTER_AUTH_SECRET is set to something other than this value.
const DEV_BETTER_AUTH_SECRET = 'emitsignal-dev-better-auth-secret-32chars!!';

const environmentSchema = Type.Object({
    API_URL: Type.String({ default: 'http://localhost:5001' }),
    APP_URL: Type.String({ default: 'http://localhost:5002' }),

    // Apple Sign In (optional — all four are required to enable). APPLE_CLIENT_ID
    // is the Service ID (web) reverse-domain identifier; APPLE_PRIVATE_KEY is the
    // full PKCS#8 `.p8` contents. APPLE_APP_BUNDLE_IDENTIFIER is the native iOS
    // App ID, required only for native ID-token sign-in from the mobile app.
    APPLE_APP_BUNDLE_IDENTIFIER: Type.Optional(Type.String()),
    APPLE_CLIENT_ID: Type.Optional(Type.String()),
    APPLE_KEY_ID: Type.Optional(Type.String()),
    APPLE_PRIVATE_KEY: Type.Optional(Type.String()),
    APPLE_TEAM_ID: Type.Optional(Type.String()),

    // Comma-separated allowlist of emails permitted to sign in via email OTP.
    // Empty = allowlist disabled (anyone may sign in).
    AUTH_ALLOWED_EMAILS: Type.String({ default: '' }),

    BETTER_AUTH_SECRET: Type.String({ default: DEV_BETTER_AUTH_SECRET }),

    EMAIL_FROM: Type.String({ default: 'EmitSignal <noreply@emitsignal.com>' }),
    EMAIL_PROVIDER: Type.Union(
        [Type.Literal('log'), Type.Literal('smtp'), Type.Literal('resend')],
        {
            default: 'log',
        },
    ),

    EMIT_SIGNAL_HTTP_PORT: Type.Number({ default: 5001 }),
    EXPO_ACCESS_TOKEN: Type.Optional(Type.String()),

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
    S3_ENDPOINT: Type.Optional(Type.String()),

    S3_FORCE_PATH_STYLE: Type.Optional(Type.Boolean()),
    S3_PRIVATE_BUCKET_NAME: Type.Optional(Type.String()),
    S3_PUBLIC_BUCKET_NAME: Type.Optional(Type.String()),
    S3_PUBLIC_URL_BASE: Type.Optional(Type.String()),
    S3_REGION: Type.Optional(Type.String()),
    S3_SECRET_ACCESS_KEY: Type.Optional(Type.String()),

    SENTRY_DSN: Type.Optional(Type.String()),
    SENTRY_ENABLED: Type.Boolean({ default: true }),

    SMTP_HOST: Type.String({ default: 'localhost' }),
    SMTP_PASS: Type.Optional(Type.String()),
    SMTP_PORT: Type.Number({ default: 1025 }),
    SMTP_USER: Type.Optional(Type.String()),

    STRIPE_PRICE_BEAM_MONTHLY: Type.Optional(Type.String()),
    STRIPE_PRICE_BEAM_YEARLY: Type.Optional(Type.String()),
    STRIPE_PRICE_PULSE_MONTHLY: Type.Optional(Type.String()),
    STRIPE_PRICE_PULSE_YEARLY: Type.Optional(Type.String()),
    STRIPE_SECRET_KEY: Type.Optional(Type.String()),
    STRIPE_WEBHOOK_SECRET: Type.Optional(Type.String()),

    UPLOAD_DIR: Type.String({ default: './uploads' }),
});

export type Environment = typeof environment;

export const environment = Value.Parse(environmentSchema, Bun.env);

// Fail closed in production: never allow the app to sign sessions/tokens with the
// publicly-known dev fallback secret. This is the single most dangerous default,
// since it ships in the open-source repo.
if (
    Bun.env.NODE_ENV === 'production' &&
    (!environment.BETTER_AUTH_SECRET || environment.BETTER_AUTH_SECRET === DEV_BETTER_AUTH_SECRET)
) {
    throw new Error(
        'BETTER_AUTH_SECRET must be set to a strong, unique value in production ' +
            '(e.g. `openssl rand -base64 32`). Refusing to boot with the dev default.',
    );
}
