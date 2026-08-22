import { fromTypes, openapi } from '@elysia/openapi';
import { opentelemetry } from '@elysia/opentelemetry';
import * as Sentry from '@sentry/bun';
import { Elysia } from 'elysia';

import { getBilling } from '#/http/billing/get';
import { health } from '#/http/health/get';
import { acknowledge } from '#/http/messages/acknowledge';
import { attachments } from '#/http/messages/attachments';
import { getMessage } from '#/http/messages/get';
import { purgeSignals } from '#/http/messages/purge';
import { corsPlugin } from '#/http/plugins/cors-plugin';
import { errorResponsePlugin } from '#/http/plugins/error-response-plugin';
import { loggerPlugin } from '#/http/plugins/logger-plugin';
import { rateLimitPlugin } from '#/http/plugins/rate-limit-plugin';
import { deletePushToken } from '#/http/push-tokens/delete';
import { listPushTokens } from '#/http/push-tokens/list';
import { registerPushToken } from '#/http/push-tokens/register';
import { updatePushToken } from '#/http/push-tokens/update';
import { stats } from '#/http/stats/get';
import { claimSubscriptions } from '#/http/subscriptions/claim';
import { listSubscriptions } from '#/http/subscriptions/list';
import { listSubscriptionMessages } from '#/http/subscriptions/messages';
import { subscriptionMetrics } from '#/http/subscriptions/metrics';
import { subscribe } from '#/http/subscriptions/subscribe';
import { unsubscribe } from '#/http/subscriptions/unsubscribe';
import { updateSubscription } from '#/http/subscriptions/update';
import { claimTopic } from '#/http/topic/claim';
import { getTopic } from '#/http/topic/get';
import { listTopics } from '#/http/topic/list';
import { listen } from '#/http/topic/listen';
import { listenMulti } from '#/http/topic/listen-multi';
import { messages } from '#/http/topic/messages';
import { topicMetrics } from '#/http/topic/metrics';
import { publish } from '#/http/topic/publish';
import { suggestions } from '#/http/topic/suggestions';
import { updateTopic } from '#/http/topic/update';
import { serveUpload } from '#/http/uploads/serve';
import { userAvatar } from '#/http/user/avatar';
import { createWebhook } from '#/http/webhooks/create';
import { deleteWebhook } from '#/http/webhooks/delete';
import { listDeliveries } from '#/http/webhooks/deliveries';
import { getWebhook } from '#/http/webhooks/get';
import { listWebhooks } from '#/http/webhooks/list';
import { receiveWebhook } from '#/http/webhooks/receive';
import { streamWebhookDeliveries } from '#/http/webhooks/stream';
import { updateWebhook } from '#/http/webhooks/update';
import { auth } from '#/lib/auth';
import { Email } from '#/lib/email';
import { EmailService } from '#/lib/email-service';
import { shutdownTelemetry } from '#/lib/instrumentation';
import { flushLogs, logger } from '#/lib/logger';
import { emailQueue, purgeQueue, pushQueue, redisConnection, scheduleQueue } from '#/lib/queue';
import { redis } from '#/lib/redis';
import { FileStorageService } from '#/lib/storage';
import { environment, isProduction } from '#/schema/environment';
import { isUnobservedPath } from '#/utils/observability';

Email.init(environment);
EmailService.init(emailQueue);
FileStorageService.init(environment);

const MAX_REQUEST_BODY_BYTES = 110 * 1024 * 1024;

const app = new Elysia({
    serve: {
        // SSE connections send a keep-alive every 25s; the socket idle timeout
        // must comfortably exceed that or Bun closes idle streams early.
        idleTimeout: 120,
        maxRequestBodySize: MAX_REQUEST_BODY_BYTES,
    },
})
    .use(
        opentelemetry({
            checkIfShouldTrace: (request) => !isUnobservedPath(new URL(request.url).pathname),
        }),
    )
    .use(loggerPlugin)
    .use(errorResponsePlugin)
    .use(rateLimitPlugin)
    .use(openapi({ enabled: !isProduction, references: fromTypes() }))
    .use(corsPlugin)
    .all('/api/auth/*', (ctx) => auth.handler(ctx.request))
    .get('/', () => ({
        name: 'Welcome to EmitSignal',
    }))
    .use(acknowledge)
    .use(attachments)
    .use(claimSubscriptions)
    .use(claimTopic)
    .use(createWebhook)
    .use(deletePushToken)
    .use(deleteWebhook)
    .use(getBilling)
    .use(getMessage)
    .use(getTopic)
    .use(getWebhook)
    .use(health)
    .use(listDeliveries)
    .use(listen)
    .use(listenMulti)
    .use(listPushTokens)
    .use(listSubscriptionMessages)
    .use(listSubscriptions)
    .use(listTopics)
    .use(listWebhooks)
    .use(messages)
    .use(publish)
    .use(purgeSignals)
    .use(receiveWebhook)
    .use(registerPushToken)
    .use(serveUpload)
    .use(stats)
    .use(streamWebhookDeliveries)
    .use(subscribe)
    .use(subscriptionMetrics)
    .use(suggestions)
    .use(topicMetrics)
    .use(unsubscribe)
    .use(updatePushToken)
    .use(updateSubscription)
    .use(updateTopic)
    .use(updateWebhook)
    .use(userAvatar);

export const server = app.listen(environment.EMIT_SIGNAL_HTTP_PORT);

logger.info(
    `🟣 Server started at ${environment.EMIT_SIGNAL_HTTP_PORT} ` +
        `(env: ${environment.NODE_ENV}, trusted proxy header: ${environment.TRUSTED_PROXY_HEADER})`,
);

if (isProduction && environment.TRUSTED_PROXY_HEADER === 'none') {
    logger.warn(
        'TRUSTED_PROXY_HEADER is "none" in production: client IPs come from the TCP peer address. ' +
            'If this server is behind a proxy or CDN, set it to the header your proxy sets ' +
            '(cf-connecting-ip, x-real-ip, or x-forwarded-for) or all anonymous traffic will share one rate-limit bucket.',
    );
}

let isShuttingDown = false;

async function shutdown() {
    /**
     * The isShuttingDown flag ensures that no matter how many times Sentry's internal handlers
     * re-trigger your signal callbacks, the shutdown logic only executes once — queues,
     * Redis connections, and Sentry all close cleanly without the "Connection is closed" error.
     */

    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    logger.info('shutting down server');

    await emailQueue.close();
    await purgeQueue.close();
    await pushQueue.close();
    await scheduleQueue.close();

    await redis.quit();
    await redisConnection.quit();

    server.stop();

    await flushLogs();
    await shutdownTelemetry();
    await Sentry.close(2000);

    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
