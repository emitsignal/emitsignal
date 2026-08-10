import { t } from 'elysia';

import {
    isVerificationScheme,
    parseVerificationConfig,
    schemeNeedsConfig,
    type VerificationScheme,
} from '#/utils/webhook-signature';

export const verificationBodySchema = {
    secret: t.Optional(t.Nullable(t.String({ maxLength: 512, minLength: 1 }))),
    verification: t.Optional(t.String({ maxLength: 32 })),
    verificationConfig: t.Optional(t.Nullable(t.String({ maxLength: 1024 }))),
};

export interface VerificationBody {
    secret?: null | string;
    verification?: string;
    verificationConfig?: null | string;
}

export type VerificationValidation =
    | { error: 'invalid_verification_config' | 'invalid_verification_scheme' | 'missing_secret' }
    | { ok: true; scheme: VerificationScheme };

/**
 * Validates a create/update request's verification fields.
 *
 * `hasStoredSecret` lets an update change the scheme or config without
 * re-sending a secret that is already on the row.
 */
export function validateVerificationBody(
    body: VerificationBody,
    hasStoredSecret: boolean,
): VerificationValidation {
    const scheme = body.verification ?? 'none';

    if (!isVerificationScheme(scheme)) {
        return { error: 'invalid_verification_scheme' };
    }

    if (scheme === 'none') {
        return { ok: true, scheme };
    }

    const secretAvailable = body.secret === null ? false : !!body.secret || hasStoredSecret;

    if (!secretAvailable) {
        return { error: 'missing_secret' };
    }

    if (schemeNeedsConfig(scheme) && !parseVerificationConfig(body.verificationConfig ?? null)) {
        return { error: 'invalid_verification_config' };
    }

    return { ok: true, scheme };
}
