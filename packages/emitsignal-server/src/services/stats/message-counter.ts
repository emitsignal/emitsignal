import { logger } from '#/lib/logger';
import { prisma } from '#/lib/prisma';
import { redis } from '#/lib/redis';

const COUNTER_KEY = 'messages';
const REDIS_KEY = `counter:${COUNTER_KEY}`;

const testCounters = new Map<string, number>();

export async function flushMessageCounter(): Promise<void> {
    const live = await readLiveTotal();

    if (live === null) {
        return;
    }

    // GREATEST, not assignment: a flush landing between a reseeding INCR and its
    // INCRBY must not write the momentarily small live value over the total.
    await prisma.$executeRaw`
        INSERT INTO "Counter" ("key", "total", "updatedAt")
        VALUES (${COUNTER_KEY}, ${BigInt(live)}, NOW())
        ON CONFLICT ("key") DO UPDATE
            SET "total" = GREATEST("Counter"."total", EXCLUDED."total"),
                "updatedAt" = EXCLUDED."updatedAt"
    `;
}

export async function incrementMessageCounter(): Promise<void> {
    try {
        const total = await addToLiveTotal(1);

        // 1 means the key was absent, so Redis lost the total; fold it back in.
        // Additive, so publishes racing with the reseed are still counted.
        if (total === 1) {
            const stored = await readStoredTotal();

            if (stored > 0) {
                await addToLiveTotal(stored);
            }
        }
    } catch (error) {
        logger.error({ error }, 'message counter increment failed');
    }
}

export async function readMessageTotal(): Promise<number> {
    try {
        const live = await readLiveTotal();

        return live === null ? await readStoredTotal() : live;
    } catch (error) {
        logger.error({ error }, 'message counter read failed');

        return 0;
    }
}

export function resetMessageCounterForTests(): void {
    testCounters.clear();
}

async function addToLiveTotal(amount: number): Promise<number> {
    if (Bun.env.NODE_ENV === 'test') {
        const total = (testCounters.get(REDIS_KEY) ?? 0) + amount;

        testCounters.set(REDIS_KEY, total);

        return total;
    }

    return redis.incrby(REDIS_KEY, amount);
}

async function readLiveTotal(): Promise<null | number> {
    if (Bun.env.NODE_ENV === 'test') {
        return testCounters.get(REDIS_KEY) ?? null;
    }

    const raw = await redis.get(REDIS_KEY);

    return raw === null ? null : Math.max(0, Number.parseInt(raw, 10));
}

async function readStoredTotal(): Promise<number> {
    const counter = await prisma.counter.findUnique({ where: { key: COUNTER_KEY } });

    return counter ? Number(counter.total) : 0;
}
