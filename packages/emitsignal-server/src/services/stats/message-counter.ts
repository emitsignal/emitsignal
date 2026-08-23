import { logger } from '#/lib/logger';
import { prisma } from '#/lib/prisma';

const COUNTER_KEY = 'messages';

let total = 0;
let flushed = 0;

export async function flushMessageCounter(): Promise<void> {
    // Read once up front: an increment landing mid-write must not be recorded as
    // persisted, or it would be lost until the next message arrived.
    const pending = total;

    if (pending === flushed) {
        return;
    }

    try {
        // GREATEST, not assignment: during a rolling restart the outgoing process can
        // flush after the incoming one has seeded, and must not write the older total
        // back over it.
        await prisma.$executeRaw`
            INSERT INTO "Counter" ("key", "total", "updatedAt")
            VALUES (${COUNTER_KEY}, ${BigInt(pending)}, NOW())
            ON CONFLICT ("key") DO UPDATE
                SET "total" = GREATEST("Counter"."total", EXCLUDED."total"),
                    "updatedAt" = EXCLUDED."updatedAt"
        `;

        flushed = pending;
    } catch (error) {
        // flushed stays behind, so the next tick retries this total.
        logger.error({ error }, 'message counter flush failed');
    }
}

export function incrementMessageCounter(): void {
    total += 1;
}

export async function loadMessageCounter(): Promise<void> {
    try {
        const counter = await prisma.counter.findUnique({ where: { key: COUNTER_KEY } });

        total = counter ? Number(counter.total) : 0;
        flushed = total;
    } catch (error) {
        logger.error({ error }, 'message counter load failed');
    }
}

export function readMessageTotal(): number {
    return total;
}

export function resetMessageCounterForTests(): void {
    total = 0;
    flushed = 0;
}
