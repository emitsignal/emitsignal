import type { JobsOptions, Queue } from 'bullmq';

import { logger } from '#/lib/logger';

// Publish paths enqueue without awaiting so a slow Redis never holds up the
// response. The catch is the whole point: an unhandled rejection here means the
// message row exists, the caller was told it was accepted, and delivery never
// happens — previously with nothing in the logs to explain it.
export function enqueueDetached<TData, TResult, TName extends string>(
    queue: Queue<TData, TResult, TName>,
    name: TName,
    data: TData,
    options?: JobsOptions,
): void {
    // BullMQ's own `add` narrows the name through ExtractNameType, which does not
    // survive being passed through a generic wrapper. Call-site types are still
    // checked by the parameters above.
    const add = queue.add as (name: TName, data: TData, options?: JobsOptions) => Promise<unknown>;

    add(name, data, options).catch((error: unknown) => {
        logger.error({ error, job: name, queue: queue.name }, 'failed to enqueue job');
    });
}
