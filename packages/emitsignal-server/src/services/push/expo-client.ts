import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';

import { environment } from '#/schema/environment';

import type { PushJob } from './types';

const MAX_BODY_LENGTH = 160;

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export type ExpoSender = (chunk: ExpoPushMessage[]) => Promise<ExpoPushTicket[]>;

const expo = new Expo({
    accessToken: environment.EXPO_ACCESS_TOKEN,
    maxConcurrentRequests: 6,
});

export function buildExpoMessages(tokens: string[], job: PushJob): ExpoPushMessage[] {
    const truncatedBody =
        job.body.length > MAX_BODY_LENGTH ? `${job.body.slice(0, MAX_BODY_LENGTH - 1)}…` : job.body;

    const hasActions = job.actions && job.actions.length > 0;

    return tokens
        .filter((token) => Expo.isExpoPushToken(token))
        .map((token) => ({
            body: truncatedBody,
            categoryId: hasActions ? 'emitsignal-message' : undefined,
            data: {
                actions: hasActions ? JSON.stringify(job.actions) : undefined,
                createdAt: job.createdAt,
                messageId: job.messageId,
                priority: job.priority,
                topicId: job.topicId,
                topicName: job.topicName,
            },
            // Lets the iOS notification service extension patch the widget
            // snapshot before the notification is shown.
            mutableContent: true,
            priority: job.priority >= 4 ? 'high' : 'normal',
            subtitle: job.title,
            title: job.topicDisplayName,
            to: token,
        }));
}

export async function sendExpoMessages(
    messages: ExpoPushMessage[],
    send: ExpoSender = (chunk) => expo.sendPushNotificationsAsync(chunk),
): Promise<void> {
    const chunks = expo.chunkPushNotifications(messages);

    await Promise.all(chunks.map((chunk) => sendChunk(chunk, send)));
}

// Bun's fetch is not auto-instrumented by Sentry or the OTel SDK, so without
// this span the Expo round trip — most of a push job's wall time — shows up as
// an unexplained gap between the last query and the end of the job.
async function sendChunk(chunk: ExpoPushMessage[], send: ExpoSender): Promise<void> {
    // Resolved per call rather than at module load: whichever module is
    // imported before the SDK registers would otherwise hold a tracer bound to
    // a provider that no longer exports anything.
    await trace.getTracer('emitsignal.push').startActiveSpan(
        'expo.push.send',
        {
            attributes: {
                'http.request.method': 'POST',
                'messaging.batch.message_count': chunk.length,
                'server.address': 'exp.host',
                'url.full': EXPO_PUSH_ENDPOINT,
            },
            kind: SpanKind.CLIENT,
        },
        async (span) => {
            try {
                const tickets = await send(chunk);

                // Expo reports per-token failures in the ticket body rather than
                // by rejecting, so a fully "successful" call can still deliver
                // nothing. Surfacing the count keeps that from staying silent.
                const rejected = tickets.filter((ticket) => ticket.status === 'error');

                span.setAttribute('expo.push.rejected_count', rejected.length);
                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {
                span.recordException(error instanceof Error ? error : new Error(String(error)));
                span.setStatus({ code: SpanStatusCode.ERROR });

                throw error;
            } finally {
                span.end();
            }
        },
    );
}
