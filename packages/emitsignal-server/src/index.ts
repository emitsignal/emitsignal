import { fromTypes, openapi } from '@elysia/openapi';
import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';

import pkg from '../package.json';
import { magicLink } from './http/auth/magic-link';
import { me } from './http/auth/me';
import { verify } from './http/auth/verify';
import { registerPushToken } from './http/push-tokens/register';
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
import { emailQueue, redisConnection } from './lib/queue';
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
    .use(magicLink)
    .use(verify)
    .use(me)
    .use(listTopics)
    .use(getTopic)
    .use(publish)
    .use(messages)
    .use(listen)
    .use(listenMulti)
    .use(listSubscriptions)
    .use(subscribe)
    .use(unsubscribe)
    .use(registerPushToken)
    .listen(environment.EMIT_SIGNAL_HTTP_PORT);

logger.info('🟣 Server started');

async function shutdown() {
    logger.info('shutting down server');

    await emailQueue.close();
    await redisConnection.quit();
    server.stop();

    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
