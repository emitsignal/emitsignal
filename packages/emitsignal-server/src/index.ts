import { fromTypes, openapi } from '@elysia/openapi';
import { opentelemetry } from '@elysia/opentelemetry';
import { cors } from '@elysiajs/cors';
import * as Sentry from '@sentry/bun';
import { Elysia } from 'elysia';

import pkg from '../package.json';
import { magicLink } from './http/auth/magic-link';
import { me } from './http/auth/me';
import { verify } from './http/auth/verify';
import { acknowledge } from './http/messages/acknowledge';
import { attachments } from './http/messages/attachments';
import { getMessage } from './http/messages/get';
import { loggerPlugin } from './http/plugins/logger-plugin';
import { rateLimitPlugin } from './http/plugins/rate-limit-plugin';
import { listPushTokens } from './http/push-tokens/list';
import { registerPushToken } from './http/push-tokens/register';
import { updatePushToken } from './http/push-tokens/update';
import { listSubscriptions } from './http/subscriptions/list';
import { subscribe } from './http/subscriptions/subscribe';
import { unsubscribe } from './http/subscriptions/unsubscribe';
import { getTopic } from './http/topic/get';
import { listTopics } from './http/topic/list';
import { listen } from './http/topic/listen';
import { listenMulti } from './http/topic/listen-multi';
import { messages } from './http/topic/messages';
import { topicMetrics } from './http/topic/metrics';
import { publish } from './http/topic/publish';
import { suggestions } from './http/topic/suggestions';
import { createWebhook } from './http/webhooks/create';
import { deleteWebhook } from './http/webhooks/delete';
import { listDeliveries } from './http/webhooks/deliveries';
import { getWebhook } from './http/webhooks/get';
import { listWebhooks } from './http/webhooks/list';
import { receiveWebhook } from './http/webhooks/receive';
import { updateWebhook } from './http/webhooks/update';
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
    .use(cors({ allowedHeaders: '*' }))
    .get('/', () => ({ name: 'emitsignal', version: pkg.version }))
    .use(acknowledge)
    .use(attachments)
    .use(getMessage)
    .get('/uploads/:file', async ({ params }) => {
        return Bun.file(`${environment.UPLOAD_DIR}/${params.file}`);
    })
    .use(getTopic)
    .use(listen)
    .use(listenMulti)
    .use(listPushTokens)
    .use(listSubscriptions)
    .use(listTopics)
    .use(magicLink)
    .use(me)
    .use(messages)
    .use(topicMetrics)
    .use(publish)
    .use(registerPushToken)
    .use(subscribe)
    .use(suggestions)
    .use(unsubscribe)
    .use(updatePushToken)
    .use(verify)
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
