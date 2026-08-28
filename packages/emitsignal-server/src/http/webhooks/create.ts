import { generateWebhookSlug, isValidWebhookSlug } from '@emitsignal/shared/webhook-slug';
import Elysia, { t } from 'elysia';

import { authPlugin } from '#/http/auth/plugin';
import {
    validateVerificationBody,
    verificationBodySchema,
} from '#/http/webhooks/verification-input';
import { encryptSecret } from '#/lib/crypto/secret-box';
import { verifySlugReservation } from '#/lib/crypto/slug-reservation';
import { prisma } from '#/lib/prisma';
import { getUserPlan } from '#/services/billing/get-user-plan';
import { PLANS } from '#/services/billing/plans';
import { canPublishToTopicName } from '#/services/topic-access';
import { schemeNeedsConfig } from '#/utils/webhook-signature';

export const createWebhook = new Elysia().use(authPlugin).post(
    '/webhooks',
    async ({ body, status, userId }) => {
        if (!(await canPublishToTopicName(body.topicName, userId))) {
            return status(403, {
                error: 'forbidden',
                message: 'not allowed to publish to this topic',
            });
        }

        const plan = await getUserPlan(userId);
        const maxWebhooks = PLANS[plan].limits.maxWebhooks;
        const webhookCount = await prisma.webhook.count({ where: { userId } });

        if (webhookCount >= maxWebhooks) {
            return status(403, {
                error: 'plan_limit_reached',
                limit: maxWebhooks,
                metric: 'webhooks',
                plan,
            });
        }

        const verification = validateVerificationBody(body, false);

        if ('error' in verification) {
            return status(400, { error: verification.error });
        }

        const source = body.source ?? 'custom';

        // The signature is what stops a client choosing its own endpoint URL. The prefix
        // is deliberately not tied to the source: a slug reserved before the source was
        // switched must keep working.
        if (body.slug) {
            if (!isValidWebhookSlug(body.slug)) {
                return status(400, { error: 'invalid_slug' });
            }

            if (!body.reservation || !verifySlugReservation(body.slug, body.reservation)) {
                return status(400, { error: 'invalid_slug_reservation' });
            }
        }

        const slug = body.slug ?? generateWebhookSlug(source);

        const webhook = await prisma.webhook
            .create({
                data: {
                    name: body.name || `${source} webhook`,
                    secretCiphertext: body.secret ? encryptSecret(body.secret) : null,
                    slug,
                    source,
                    template: body.template ?? null,
                    topicName: body.topicName,
                    userId,
                    verification: verification.scheme,
                    verificationConfig: schemeNeedsConfig(verification.scheme)
                        ? (body.verificationConfig ?? null)
                        : null,
                },
                select: {
                    createdAt: true,
                    id: true,
                    name: true,
                    slug: true,
                    source: true,
                    status: true,
                    template: true,
                    topicName: true,
                    verification: true,
                    verificationConfig: true,
                },
            })
            .catch((error: unknown) => {
                if (error instanceof Error && 'code' in error && error.code === 'P2002') {
                    return null;
                }

                throw error;
            });

        if (!webhook) {
            return status(409, { error: 'slug_taken' });
        }

        return {
            ...webhook,
            createdAt: Math.floor(webhook.createdAt.getTime() / 1000),
            endpointUrl: `/h/${webhook.slug}`,
            hasSecret: !!body.secret,
            templated: !!webhook.template,
        };
    },
    {
        authRequired: true,
        body: t.Object({
            name: t.Optional(t.String()),
            reservation: t.Optional(t.String()),
            slug: t.Optional(t.String()),
            source: t.Optional(t.String({ default: 'custom' })),
            template: t.Optional(t.Nullable(t.String())),
            topicName: t.String(),
            ...verificationBodySchema,
        }),
    },
);
