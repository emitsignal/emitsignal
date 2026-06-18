import { fromTypes, openapi } from '@elysia/openapi';
import { opentelemetry } from '@elysia/opentelemetry';
import { cors } from '@elysiajs/cors';
import * as Sentry from '@sentry/bun';
import { Elysia } from 'elysia';
import path from 'node:path';

import pkg from '../package.json';
import { getBilling } from './http/billing/get';
import { acknowledge } from './http/messages/acknowledge';
import { attachments } from './http/messages/attachments';
import { getMessage } from './http/messages/get';
import { loggerPlugin } from './http/plugins/logger-plugin';
import { rateLimitPlugin } from './http/plugins/rate-limit-plugin';
import { listPushTokens } from './http/push-tokens/list';
import { registerPushToken } from './http/push-tokens/register';
import { updatePushToken } from './http/push-tokens/update';
import { listSubscriptions } from './http/subscriptions/list';
import { listSubscriptionMessages } from './http/subscriptions/messages';
import { subscribe } from './http/subscriptions/subscribe';
import { unsubscribe } from './http/subscriptions/unsubscribe';
import { updateSubscription } from './http/subscriptions/update';
import { getTopic } from './http/topic/get';
import { listTopics } from './http/topic/list';
import { listen } from './http/topic/listen';
import { listenMulti } from './http/topic/listen-multi';
import { messages } from './http/topic/messages';
import { topicMetrics } from './http/topic/metrics';
import { publish } from './http/topic/publish';
import { suggestions } from './http/topic/suggestions';
import { userAvatar } from './http/user/avatar';
import { createWebhook } from './http/webhooks/create';
import { deleteWebhook } from './http/webhooks/delete';
import { listDeliveries } from './http/webhooks/deliveries';
import { getWebhook } from './http/webhooks/get';
import { listWebhooks } from './http/webhooks/list';
import { receiveWebhook } from './http/webhooks/receive';
import { updateWebhook } from './http/webhooks/update';
import { auth } from './lib/auth';
import { Email } from './lib/email';
import { EmailService } from './lib/email-service';
import { logger } from './lib/logger';
import { emailQueue, pushQueue, redisConnection, scheduleQueue } from './lib/queue';
import { rateLimitRedis } from './lib/rate-limit';
import { FileStorageService } from './lib/storage';
import { environment } from './schema/environment';

Email.init(environment);
EmailService.init(emailQueue);
FileStorageService.init(environment);

const isProduction = Bun.env.NODE_ENV === 'production';

const app = new Elysia()
    .use(opentelemetry())
    .use(loggerPlugin)
    .use(rateLimitPlugin)
    .use(openapi({ enabled: !isProduction, references: fromTypes() }))
    .use(
        cors({
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            origin: [environment.APP_URL],
        }),
    )
    .all('/api/auth/*', (ctx) => auth.handler(ctx.request))
    .get('/', () => ({ name: 'emitsignal', version: pkg.version }))
    .use(getBilling)
    .use(acknowledge)
    .use(attachments)
    .use(getMessage)
    .get('/uploads/*', async ({ params, status }) => {
        if (environment.FILE_STORAGE_PROVIDER === 's3') {
            return status(501);
        }

        const resolved = path.resolve(environment.UPLOAD_DIR, params['*']);
        const base = path.resolve(environment.UPLOAD_DIR);

        if (!resolved.startsWith(base + path.sep) && base !== resolved) {
            return status(403);
        }

        return Bun.file(resolved);
    })
    .use(getTopic)
    .use(listen)
    .use(listenMulti)
    .use(listPushTokens)
    .use(listSubscriptionMessages)
    .use(listSubscriptions)
    .use(listTopics)
    .use(messages)
    .use(topicMetrics)
    .use(publish)
    .use(registerPushToken)
    .use(subscribe)
    .use(suggestions)
    .use(unsubscribe)
    .use(updatePushToken)
    .use(updateSubscription)
    .use(userAvatar)
    .use(listWebhooks)
    .use(getWebhook)
    .use(createWebhook)
    .use(updateWebhook)
    .use(deleteWebhook)
    .use(listDeliveries)
    .use(receiveWebhook);

export const server = app.listen(environment.EMIT_SIGNAL_HTTP_PORT);

logger.info(`🟣 Server started at ${environment.EMIT_SIGNAL_HTTP_PORT}`);

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
    await pushQueue.close();
    await scheduleQueue.close();

    await redisConnection.quit();
    await rateLimitRedis.quit();

    server.stop();

    await Sentry.close(2000);

    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
