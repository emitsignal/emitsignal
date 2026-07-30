import { parseTemplate, renderTemplate } from '@emitsignal/shared/webhook-template';
import Elysia, { t } from 'elysia';

import { consumeLimit } from '../../http/plugins/rate-limit-plugin';
import { getUserPlan } from '../../lib/billing/get-user-plan';
import { messageExpiresAt, messageRetentionDays } from '../../lib/billing/retention';
import { bus } from '../../lib/event-bus';
import { prisma } from '../../lib/prisma';
import { pushQueue } from '../../lib/queue';
import { webhookReceiveLimiter } from '../../lib/rate-limit';
import { getOrCreateTopic, serializeMessage } from '../../lib/topic';
import { canPublishToTopicName } from '../../lib/topic-access';
import { resolveUserId } from '../auth/plugin';

// Public endpoint: cap the inbound payload so a single caller can't store huge
// WebhookDelivery rows or exhaust memory. 64 KB is generous for webhook JSON.
const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;

export const receiveWebhook = new Elysia().post(
    '/h/:slug',
    async ({ body, headers, params, status }) => {
        const start = Date.now();

        const contentLength = Number(headers['content-length'] ?? 0);

        if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BODY_BYTES) {
            return status(413, { error: 'payload_too_large' });
        }

        const webhook = await prisma.webhook.findUnique({
            select: {
                id: true,
                source: true,
                status: true,
                template: true,
                topicName: true,
                userId: true,
            },
            where: { slug: params.slug },
        });

        if (!webhook) {
            return status(404, { error: 'not_found' });
        }

        if (webhook.status === 'paused') {
            return status(503, { error: 'webhook_paused' });
        }

        if (!(await canPublishToTopicName(webhook.topicName, webhook.userId ?? null))) {
            return status(403, { error: 'forbidden' });
        }

        const payload = body as Record<string, unknown>;
        const template = parseTemplate(webhook.template);
        const templated = !!template;

        let messageBody: string;
        let priority: number;
        let tags: string[];
        let title: string;

        if (template) {
            const rendered = renderTemplate(template, payload);

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
        const senderId = await resolveUserId({ headers });

        // Webhook deliveries are immediate. Retention follows the webhook owner's
        // plan (the webhook belongs to a user even when the poster is anonymous).
        const deliveredAt = new Date();
        const plan = webhook.userId ? await getUserPlan(webhook.userId) : null;

        const message = await prisma.message.create({
            data: {
                actions: '[]',
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

        const event = await serializeMessage({ ...message, topicId: topic.id }, 0, false);

        bus.publish(topic.name, { ...event, topicName: topic.name });

        pushQueue.add('push-message', {
            actions: [],
            body: messageBody,
            messageId: message.id,
            priority,
            title,
            topicDisplayName: topic.displayName,
            topicId: topic.id,
            topicName: topic.name,
        });

        const ms = Date.now() - start;

        const delivery = await prisma.webhookDelivery.create({
            data: {
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
        beforeHandle: ({ params, set }) =>
            consumeLimit(webhookReceiveLimiter, `webhook:${params.slug}`, set),
        body: t.Unknown(),
    },
);
