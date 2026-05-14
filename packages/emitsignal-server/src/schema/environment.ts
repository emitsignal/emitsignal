import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const environmentSchema = Type.Object({
    APP_URL: Type.String({ default: 'http://localhost:8081' }),
    EMAIL_FROM: Type.String({ default: 'EmitSignal <noreply@emitsignal.com>' }),
    EMAIL_PROVIDER: Type.Union(
        [Type.Literal('log'), Type.Literal('smtp'), Type.Literal('resend')],
        {
            default: 'log',
        },
    ),
    EMIT_SIGNAL_HTTP_PORT: Type.Number({ default: 3333 }),
    RESEND_API_KEY: Type.Optional(Type.String()),
    SMTP_HOST: Type.String({ default: 'localhost' }),
    SMTP_PASS: Type.Optional(Type.String()),
    SMTP_PORT: Type.Number({ default: 1025 }),
    SMTP_USER: Type.Optional(Type.String()),
});

export type Environment = typeof environment;

export const environment = Value.Parse(environmentSchema, Bun.env);
