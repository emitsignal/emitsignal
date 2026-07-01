import { parseTemplate, renderTemplate } from '@emitsignal/shared/webhook-template';
import Elysia, { t } from 'elysia';

import { bus } from '../../lib/event-bus';
import { prisma } from '../../lib/prisma';
import { pushQueue } from '../../lib/queue';
import { getOrCreateTopic, serializeMessage } from '../../lib/topic';
import { resolveUserId } from '../auth/plugin';

export const receiveWebhook = new Elysia().post(
    '/h/:slug',
    async ({ body, headers, params, status }) => {
        const start = Date.now();

        const webhook = await prisma.webhook.findUnique({
            select: { id: true, source: true, status: true, template: true, topicName: true },
            where: { slug: params.slug },
        });

        if (!webhook) {
            return status(404, { error: 'not_found' });
        }

        if (webhook.status === 'paused') {
            return status(503, { error: 'webhook_paused' });
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

        const message = await prisma.message.create({
            data: {
                actions: '[]',
                body: messageBody,
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

        await prisma.webhookDelivery.create({
            data: {
                messageId: message.id,
                ms: Date.now() - start,
                payload: JSON.stringify(payload),
                status: 200,
                templated,
                webhookId: webhook.id,
            },
        });

        return { messageId: message.id, ok: true };
    },
    {
        body: t.Unknown(),
    },
);
