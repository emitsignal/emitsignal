// In-process pub/sub for SSE fanout.
// One bus per server instance — sufficient for single-node dev.
// For multi-node deployments, swap with Redis pub/sub or NATS.

import { EventEmitter } from "node:events";

export interface MessageEvent {
    id: string;
    topicId: string;
    topicName: string;
    title: string;
    body: string;
    priority: number;
    tags: string[];
    createdAt: number;
}

class WhinsperBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(0);
    }

    publish(topicName: string, event: MessageEvent) {
        this.emit(`topic:${topicName}`, event);
        this.emit("topic:*", event);
    }

    subscribe(
        topicName: string,
        handler: (e: MessageEvent) => void,
    ): () => void {
        const channel = topicName === "*" ? "topic:*" : `topic:${topicName}`;
        this.on(channel, handler);
        return () => this.off(channel, handler);
    }
}

export const bus = new WhinsperBus();
