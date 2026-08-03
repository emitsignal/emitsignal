// In-process pub/sub for SSE fanout.
// One bus per server instance — sufficient for single-node dev.
// For multi-node deployments, swap with Redis pub/sub or NATS.

import type { MediaRef } from '@emitsignal/shared';

import { EventEmitter } from 'node:events';

import type { Action } from '#/utils/actions';

export interface AttachmentInfo {
    filename: string;
    mimeType: string;
    size: number;
    storageKey: string;
    url: string;
}

export interface MessageEvent {
    acknowledgmentCount: number;
    actions: Action[];
    attachments: AttachmentInfo[];
    bannerImage: MediaRef | null;
    body: string;
    createdAt: number;
    id: string;
    inlineAttachments: MediaRef[];
    inlineImages: MediaRef[];
    priority: number;
    tags: string[];
    title: string;
    topicId: string;
    topicName: string;
}

export interface WebhookDeliveryEvent {
    channel: string;
    id: string;
    ms: number;
    payload: Record<string, unknown>;
    renderedBody?: string;
    renderedTitle?: string;
    source: string;
    status: number;
    t: number;
    templated: boolean;
}

class EmitSignalBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(0);
    }

    publish(topicName: string, event: MessageEvent) {
        this.emit(`topic:${topicName}`, event);
        this.emit('topic:*', event);
    }

    publishWebhookDelivery(userId: string, event: WebhookDeliveryEvent) {
        this.emit(`webhook:${userId}`, event);
    }

    subscribe(topicName: string, handler: (e: MessageEvent) => void): () => void {
        const channel = topicName === '*' ? 'topic:*' : `topic:${topicName}`;

        this.on(channel, handler);

        return () => this.off(channel, handler);
    }

    subscribeWebhookDeliveries(
        userId: string,
        handler: (e: WebhookDeliveryEvent) => void,
    ): () => void {
        const channel = `webhook:${userId}`;

        this.on(channel, handler);

        return () => this.off(channel, handler);
    }
}

export const bus = new EmitSignalBus();
