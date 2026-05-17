import { fromTypes, openapi } from '@elysia/openapi';
import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';

import pkg from '../package.json';
import { magicLink } from './http/auth/magic-link';
import { me } from './http/auth/me';
import { verify } from './http/auth/verify';
import { acknowledge } from './http/messages/acknowledge';
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
import { publish } from './http/topic/publish';
import { Email } from './lib/email';
import { EmailService } from './lib/email-service';
import { logger } from './lib/logger';
import { loggerPlugin } from './lib/logger-plugin';
import { emailQueue, pushQueue, redisConnection, scheduleQueue } from './lib/queue';
import { environment } from './schema/environment';

Email.init(environment);
EmailService.init(emailQueue);

const server = new Elysia()
    .use(loggerPlugin)
    .use(
        openapi({
            references: fromTypes(),
        }),
    )
    .use(cors({ allowedHeaders: '*' }))
    .get('/', () => ({ name: 'emitsignal', version: pkg.version }))
    .use(acknowledge)
    .use(getTopic)
    .use(listen)
    .use(listenMulti)
    .use(listPushTokens)
    .use(listSubscriptions)
    .use(listTopics)
    .use(magicLink)
    .use(me)
    .use(messages)
    .use(publish)
    .use(registerPushToken)
    .use(subscribe)
    .use(unsubscribe)
    .use(updatePushToken)
    .use(verify)
    .listen(environment.EMIT_SIGNAL_HTTP_PORT);

logger.info('🟣 Server started');

async function shutdown() {
    logger.info('shutting down server');

    await emailQueue.close();
    await pushQueue.close();
    await scheduleQueue.close();

    await redisConnection.quit();

    server.stop();

    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
