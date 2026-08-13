import type { ExpoPushTicket } from 'expo-server-sdk';

import { trace } from '@opentelemetry/api';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { describe, expect, it } from 'bun:test';

import type { PushJob } from '#/services/push/types';

const exporter = new InMemorySpanExporter();

// Must beat the import below; disable() because registration is first-write-wins.
trace.disable();
new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] }).register();

const { buildExpoMessages, sendExpoMessages } = await import('#/services/push/expo-client');

const job: PushJob = {
    actions: [],
    body: 'Deployment finished without errors',
    createdAt: 1_754_200_000_000,
    messageId: 'message-1',
    priority: 3,
    title: 'Deploy complete',
    topicDisplayName: 'Deploys',
    topicId: 'topic-1',
    topicName: 'deploys',
};

const validToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';

function sentSpans() {
    return exporter.getFinishedSpans().filter((span) => span.name === 'expo.push.send');
}

describe('sendExpoMessages tracing', () => {
    it('records the Expo round trip as a client span', async () => {
        exporter.reset();

        await sendExpoMessages(buildExpoMessages([validToken], job), () =>
            Promise.resolve([{ id: 'ticket-1', status: 'ok' }] as ExpoPushTicket[]),
        );

        const [span] = sentSpans();

        expect(span).toBeDefined();
        expect(span?.attributes['messaging.batch.message_count']).toBe(1);
        expect(span?.attributes['url.full']).toBe('https://exp.host/--/api/v2/push/send');
        expect(span?.attributes['expo.push.rejected_count']).toBe(0);
    });

    it('counts the tokens Expo rejected inside a successful call', async () => {
        exporter.reset();

        await sendExpoMessages(buildExpoMessages([validToken], job), () =>
            Promise.resolve([
                { id: 'ticket-1', status: 'ok' },
                { message: 'DeviceNotRegistered', status: 'error' },
            ] as ExpoPushTicket[]),
        );

        expect(sentSpans()[0]?.attributes['expo.push.rejected_count']).toBe(1);
    });

    it('marks the span failed when the call throws', async () => {
        exporter.reset();

        const send = () => Promise.reject(new Error('expo unreachable'));

        await expect(sendExpoMessages(buildExpoMessages([validToken], job), send)).rejects.toThrow(
            'expo unreachable',
        );

        expect(sentSpans()[0]?.status.code).toBe(2);
    });
});
