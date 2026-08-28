import { parseTemplate, renderTemplate } from '@emitsignal/shared/webhook-template';
import Elysia, { t } from 'elysia';

import type { Action } from '#/utils/actions';

import { authPlugin } from '#/http/auth/plugin';
import { consumeLimit } from '#/http/plugins/rate-limit-plugin';
import { decryptSecret } from '#/lib/crypto/secret-box';
import { bus } from '#/lib/event-bus';
import { logger } from '#/lib/logger';
import { prisma } from '#/lib/prisma';
import { pushQueue } from '#/lib/queue';
import { webhookReceiveLimiter } from '#/lib/rate-limit';
import { captureTraceContext } from '#/lib/trace-context';
import { getUserPlan } from '#/services/billing/get-user-plan';
import {
    messageExpiresAt,
    messageRetentionDays,
    webhookDeliveryExpiresAt,
    webhookRetentionDays,
} from '#/services/billing/retention';
import { serializeMessage } from '#/services/message';
import { incrementMessageCounter } from '#/services/stats/message-counter';
import { getOrCreateTopic } from '#/services/topic';
import { canPublishToTopicName } from '#/services/topic-access';
import { validateActions } from '#/utils/actions';
import {
    isVerificationScheme,
    type VerificationFailureReason,
    verifyWebhookSignature,
} from '#/utils/webhook-signature';

// Public endpoint: cap the inbound payload so a single caller can't store huge
// WebhookDelivery rows or exhaust memory. 64 KB is generous for webhook JSON.
const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;

const REJECTED_PAYLOAD_PREVIEW_BYTES = 2 * 1024;

// Signatures cover the exact bytes that were sent: re-serializing the parsed JSON
// does not reproduce them, so the raw text has to survive parsing.
const rawBodyByRequest = new WeakMap<Request, string>();

export const receiveWebhook = new Elysia().use(authPlugin).post(
    '/h/:slug',
    async ({ headers, params, request, status, userId }) => {
        const senderId = userId;

        const start = Date.now();

        const rawBody = rawBodyByRequest.get(request) ?? '';

        // content-length is caller-controlled and absent on chunked requests.
        if (Buffer.byteLength(rawBody, 'utf8') > MAX_WEBHOOK_BODY_BYTES) {
            return status(413, { error: 'payload_too_large' });
        }

        const webhook = await prisma.webhook.findUnique({
            select: {
                id: true,
                secretCiphertext: true,
                source: true,
                status: true,
                template: true,
                topicName: true,
                userId: true,
                verification: true,
                verificationConfig: true,
            },
            where: { slug: params.slug },
        });

        if (!webhook) {
            return status(404, { error: 'not_found' });
        }

        if (webhook.status === 'paused') {
            return status(503, { error: 'webhook_paused' });
        }

        // Must stay ahead of topic creation, message, push and bus fanout — an
        // unsigned request may not cause any observable side effect.
        const failure = verifyDelivery(webhook, headers, rawBody);

        if (failure) {
            await recordRejectedDelivery(webhook, rawBody, failure, Date.now() - start);

            return status(401, { error: 'invalid_signature', reason: failure });
        }

        if (!(await canPublishToTopicName(webhook.topicName, webhook.userId ?? null))) {
            return status(403, { error: 'forbidden' });
        }

        const payload = parseJsonPayload(rawBody);

        if (!payload) {
            return status(400, { error: 'invalid_json' });
        }

        const template = parseTemplate(webhook.template);
        const templated = !!template;

        let actions: Action[] = [];
        let messageBody: string;
        let priority: number;
        let tags: string[];
        let title: string;

        if (template) {
            const rendered = renderTemplate(template, payload);

            actions = viewActionFor(rendered.link, rendered.linkLabel);
            messageBody = rendered.body;
            priority = rendered.priority;
            tags = rendered.tags;
            title = rendered.title;
        } else {
            messageBody = JSON.stringify(payload, null, 2);
            priority = 3;
            tags = [webhook.source];
            title = `${webhook.source} delivery`;
        }

        const topic = await getOrCreateTopic(webhook.topicName);

        // The /h/:slug endpoint is public — anyone with the slug can post. Only
        // attribute the message to a sender when the caller authenticated the
        // request (Bearer session/API key, x-api-key, or cookie); otherwise the
        // inbound delivery has no known sender.

        // Webhook deliveries are immediate. Retention follows the webhook owner's
        // plan (the webhook belongs to a user even when the poster is anonymous).
        const deliveredAt = new Date();
        const plan = webhook.userId ? await getUserPlan(webhook.userId) : null;

        const message = await prisma.message.create({
            data: {
                actions: JSON.stringify(actions),
                body: messageBody,
                deliveredAt,
                expiresAt: messageExpiresAt(deliveredAt, messageRetentionDays(plan)),
                priority,
                senderId,
                tags,
                title,
                topicId: topic.id,
            },
        });

        incrementMessageCounter();

        const event = await serializeMessage({ ...message, topicId: topic.id }, 0, false);

        bus.publish(topic.name, { ...event, topicName: topic.name });

        pushQueue.add('push-message', {
            actions,
            body: messageBody,
            createdAt: message.createdAt.getTime(),
            messageId: message.id,
            priority,
            title,
            topicDisplayName: topic.displayName,
            topicId: topic.id,
            topicName: topic.name,
            traceContext: captureTraceContext(),
        });

        const ms = Date.now() - start;

        const deliveryExpiresAt = webhookDeliveryExpiresAt(deliveredAt, webhookRetentionDays(plan));

        const delivery = await prisma.webhookDelivery.create({
            data: {
                expiresAt: deliveryExpiresAt,
                messageId: message.id,
                ms,
                payload: JSON.stringify(payload),
                status: 200,
                templated,
                webhookId: webhook.id,
            },
            select: { createdAt: true, id: true },
        });

        bus.publishWebhookDelivery(webhook.userId, {
            channel: webhook.topicName,
            expiresAt: Math.floor(deliveryExpiresAt.getTime() / 1000),
            id: delivery.id,
            ms,
            payload,
            renderedBody: templated ? messageBody : undefined,
            renderedTitle: templated ? title : undefined,
            source: webhook.source,
            status: 200,
            t: Math.floor(delivery.createdAt.getTime() / 1000),
            templated,
        });

        return { messageId: message.id, ok: true };
    },
    {
        authOptional: true,
        beforeHandle: ({ params, set }) =>
            consumeLimit(webhookReceiveLimiter, `webhook:${params.slug}`, set),
        body: t.Unknown(),
        // Elysia's default parser consumes the stream and only returns the parsed
        // object; size and syntax are checked in the handler instead.
        parse: [
            async ({ request }) => {
                rawBodyByRequest.set(request, await request.text());

                return {};
            },
        ],
    },
);

function parseJsonPayload(rawBody: string): null | Record<string, unknown> {
    if (!rawBody.trim()) {
        return {};
    }

    try {
        const parsed: unknown = JSON.parse(rawBody);

        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        return parsed as Record<string, unknown>;
    } catch {
        return null;
    }
}

async function recordRejectedDelivery(
    webhook: { id: string; source: string; topicName: string; userId: string },
    rawBody: string,
    reason: VerificationFailureReason,
    ms: number,
): Promise<void> {
    const rejectedAt = new Date();
    const plan = webhook.userId ? await getUserPlan(webhook.userId) : null;
    const expiresAt = webhookDeliveryExpiresAt(rejectedAt, webhookRetentionDays(plan));

    // The body is unauthenticated — keep a debuggable slice, not the whole blob.
    const payload = {
        preview: rawBody.slice(0, REJECTED_PAYLOAD_PREVIEW_BYTES),
        reason,
        truncated: rawBody.length > REJECTED_PAYLOAD_PREVIEW_BYTES,
    };

    const delivery = await prisma.webhookDelivery.create({
        data: {
            expiresAt,
            messageId: null,
            ms,
            payload: JSON.stringify(payload),
            status: 401,
            templated: false,
            webhookId: webhook.id,
        },
        select: { createdAt: true, id: true },
    });

    bus.publishWebhookDelivery(webhook.userId, {
        channel: webhook.topicName,
        expiresAt: Math.floor(expiresAt.getTime() / 1000),
        id: delivery.id,
        ms,
        payload,
        source: webhook.source,
        status: 401,
        t: Math.floor(delivery.createdAt.getTime() / 1000),
        templated: false,
    });
}

// Returns null when the delivery is authentic, otherwise the failure reason.
function verifyDelivery(
    webhook: {
        secretCiphertext: null | string;
        verification: string;
        verificationConfig: null | string;
    },
    headers: Record<string, string | undefined>,
    rawBody: string,
): null | VerificationFailureReason {
    if (webhook.verification === 'none') {
        return null;
    }

    if (!isVerificationScheme(webhook.verification) || !webhook.secretCiphertext) {
        return 'bad_config';
    }

    let secret: string;

    try {
        secret = decryptSecret(webhook.secretCiphertext);
    } catch (error) {
        // Almost always a rotated WEBHOOK_SECRET_KEY, which the 401 alone hides.
        logger.error(
            { error, verification: webhook.verification },
            'webhook secret decrypt failed',
        );

        return 'bad_config';
    }

    const result = verifyWebhookSignature({
        config: webhook.verificationConfig,
        headers,
        rawBody,
        scheme: webhook.verification,
        secret,
    });

    return result.ok ? null : result.reason;
}

// The rendered link comes from the caller's payload on a public endpoint, so it
// is untrusted: run it through the same validator `POST /publish/<topic>` uses so
// only http(s) URLs are ever stored. Unlike publish, a link we cannot use never
// fails the delivery — the notification still goes out, just without a button.
function viewActionFor(link: string, label: string): Action[] {
    if (!link) {
        return [];
    }

    const validation = validateActions([
        label ? { label, type: 'view', url: link } : { type: 'view', url: link },
    ]);

    return 'ok' in validation ? validation.actions : [];
}
