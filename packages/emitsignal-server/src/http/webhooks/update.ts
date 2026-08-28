import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import {
    validateVerificationBody,
    verificationBodySchema,
} from '#/http/webhooks/verification-input';
import { encryptSecret } from '#/lib/crypto/secret-box';
import { prisma } from '#/lib/prisma';
import { canPublishToTopicName } from '#/services/topic-access';
import { schemeNeedsConfig } from '#/utils/webhook-signature';

export const updateWebhook = new Elysia().use(authPlugin).patch(
    '/webhooks/:id',
    async ({ body, params, status, userId }) => {
        const webhook = await prisma.webhook.findUnique({
            select: { secretCiphertext: true, userId: true, verification: true },
            where: { id: params.id },
        });

        if (!webhook) {
            return status(404, { error: 'not_found' });
        }

        if (webhook.userId !== userId) {
            return status(403, { error: 'forbidden' });
        }

        if (
            body.topicName !== undefined &&
            !(await canPublishToTopicName(body.topicName, userId))
        ) {
            return status(403, {
                error: 'forbidden',
                message: 'not allowed to publish to this topic',
            });
        }

        // A rename must not silently drop an existing secret.
        const touchesVerification =
            body.secret !== undefined ||
            body.verification !== undefined ||
            body.verificationConfig !== undefined;

        let verificationData: Record<string, null | string> = {};

        if (touchesVerification) {
            const validation = validateVerificationBody(
                { ...body, verification: body.verification ?? webhook.verification },
                !!webhook.secretCiphertext,
            );

            if ('error' in validation) {
                return status(400, { error: validation.error });
            }

            const clearing = validation.scheme === 'none' || body.secret === null;

            verificationData = {
                verification: validation.scheme,
                verificationConfig: schemeNeedsConfig(validation.scheme)
                    ? (body.verificationConfig ?? null)
                    : null,
            };

            if (body.secret) {
                verificationData.secretCiphertext = encryptSecret(body.secret);
            } else if (clearing) {
                verificationData.secretCiphertext = null;
            }
        }

        const updated = await prisma.webhook.update({
            data: {
                name: body.name ?? undefined,
                status: body.status ?? undefined,
                template: body.template !== undefined ? body.template : undefined,
                topicName: body.topicName ?? undefined,
                ...verificationData,
            },
            select: {
                id: true,
                name: true,
                secretCiphertext: true,
                slug: true,
                source: true,
                status: true,
                template: true,
                topicName: true,
                verification: true,
                verificationConfig: true,
            },
            where: { id: params.id },
        });

        const { secretCiphertext, ...safe } = updated;

        return { ...safe, hasSecret: !!secretCiphertext, templated: !!updated.template };
    },
    {
        authRequired: true,
        body: t.Object({
            name: t.Optional(t.String()),
            status: t.Optional(t.String()),
            template: t.Optional(t.Nullable(t.String())),
            topicName: t.Optional(t.String()),
            ...verificationBodySchema,
        }),
        params: t.Object({ id: t.String() }),
    },
);
