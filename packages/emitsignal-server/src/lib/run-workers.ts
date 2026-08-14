import type { Worker } from 'bullmq';

import * as Sentry from '@sentry/bun';

import { shutdownTelemetry } from '#/lib/instrumentation';
import { redisConnection } from '#/lib/queue/connection';

import { flushLogs, logger } from './logger';

export function runWorkers(workers: Worker[]) {
    let isShuttingDown = false;

    /**
     * The isShuttingDown flag ensures that no matter how many times Sentry's internal handlers
     * re-trigger your signal callbacks, the shutdown logic only executes once ,
     * Redis connections, and Sentry all close cleanly without the "Connection is closed" error.
     */

    async function shutdown() {
        if (isShuttingDown) {
            return;
        }

        isShuttingDown = true;

        logger.info('shutting down workers');

        await Promise.all(workers.map((worker) => worker.close()));
        await redisConnection.quit();

        await shutdownTelemetry();
        await Sentry.close(2000);
        await flushLogs();

        process.exit(0);
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
