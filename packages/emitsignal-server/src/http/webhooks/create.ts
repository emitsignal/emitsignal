import Elysia, { t } from 'elysia';

import { resolveUserId } from '#/http/auth/plugin';
import {
    validateVerificationBody,
    verificationBodySchema,
} from '#/http/webhooks/verification-input';
import { encryptSecret } from '#/lib/crypto/secret-box';
import { prisma } from '#/lib/prisma';
import { getUserPlan } from '#/services/billing/get-user-plan';
import { PLANS } from '#/services/billing/plans';
import { canPublishToTopicName } from '#/services/topic-access';
import { schemeNeedsConfig } from '#/utils/webhook-signature';

function randomSlug(prefix: string): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    let suffix = '';

    for (const byte of bytes) {
        suffix += alphabet[byte % alphabet.length];
    }

    return `${prefix}_${suffix}`;
}

const SOURCE_PREFIX: Record<string, string> = {
    custom: 'cw',
    github: 'gh',
    grafana: 'gf',
    stripe: 'st',
    vercel: 'vc',
};

export const createWebhook = new Elysia().post(
    '/webhooks',
    async ({ body, headers, status }) => {
        const userId = await resolveUserId({ headers });

        if (!userId) {
            return status(401, { error: 'missing_token' });
        }

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

        const prefix = SOURCE_PREFIX[body.source ?? 'custom'] ?? 'cw';
        const slug = randomSlug(prefix);

        const webhook = await prisma.webhook.create({
            data: {
                name: body.name || `${body.source ?? 'custom'} webhook`,
                secretCiphertext: body.secret ? encryptSecret(body.secret) : null,
                slug,
                source: body.source ?? 'custom',
                template: body.template ?? null,
                topicName: body.topicName,
                userId,
                verification: verification.scheme,
                verificationConfig: schemeNeedsConfig(verification.scheme)
                    ? (body.verificationConfig ?? null)
                    : null,
            },
            // secretCiphertext is deliberately absent: the secret is write-only.
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
        });

        return {
            ...webhook,
            createdAt: Math.floor(webhook.createdAt.getTime() / 1000),
            endpointUrl: `/h/${webhook.slug}`,
            hasSecret: !!body.secret,
            templated: !!webhook.template,
        };
    },
    {
        body: t.Object({
            name: t.Optional(t.String()),
            source: t.Optional(t.String({ default: 'custom' })),
            template: t.Optional(t.Nullable(t.String())),
            topicName: t.String(),
            ...verificationBodySchema,
        }),
    },
);
