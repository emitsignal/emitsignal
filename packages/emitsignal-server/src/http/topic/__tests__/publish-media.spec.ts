import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '../../../__tests__/mocks';

const mockBus = { publish: mock(), subscribe: mock() };
const mockPushQueue = { add: mock(() => Promise.resolve()) };
const mockScheduleQueue = { add: mock(() => Promise.resolve()) };

mock.module('../../../lib/prisma', () => ({ prisma: prismaMock }));
mock.module('../../../lib/event-bus', () => ({ bus: mockBus }));
mock.module('../../../lib/queue', () => ({
    pushQueue: mockPushQueue,
    scheduleQueue: mockScheduleQueue,
}));
mock.module('../../auth/plugin', () => ({
    resolveUserId: ({ headers }: { headers: Record<string, string | undefined> }) =>
        Promise.resolve(headers['x-test-user-id'] ?? null),
}));

import { resetUserPlansForTests, setUserPlanForTests } from '../../../lib/billing/get-user-plan';
import { resetUsageForTests } from '../../../lib/billing/usage';
import { publish } from '../publish';

describe('POST /topic/:name — message media', () => {
    const app = new Elysia().use(publish);

    function urls(count: number): string[] {
        return Array.from(
            { length: count },
            (_unused, index) => `https://example.com/${index}.png`,
        );
    }

    function request(body: Record<string, unknown>, userId?: string) {
        return new Request('http://localhost/topic/media-topic', {
            body: JSON.stringify({
                body: 'Media test',
                priority: 3,
                tags: [],
                title: 'Media',
                ...body,
            }),
            headers: {
                'Content-Type': 'application/json',
                ...(userId ? { 'x-test-user-id': userId } : {}),
            },
            method: 'POST',
        });
    }

    beforeEach(() => {
        resetUsageForTests();
        resetUserPlansForTests();
        prismaMock.message.create.mockClear();
    });

    it('persists banner + inline refs as serialized JSON', async () => {
        setUserPlanForTests('media-user', 'free');

        const res = await app.handle(
            request(
                {
                    bannerImage: 'https://example.com/banner.png',
                    inlineAttachments: [{ href: 'https://example.com/doc.pdf', title: 'Doc' }],
                    inlineImages: ['https://example.com/a.png', 'https://example.com/b.png'],
                },
                'media-user',
            ),
        );

        expect(res.status).toBe(200);

        const [firstCall] = prismaMock.message.create.mock.calls as unknown as Array<
            [{ data: Record<string, string> }]
        >;
        const data = firstCall[0].data;

        expect(JSON.parse(data.bannerImage)).toEqual({ href: 'https://example.com/banner.png' });
        expect(JSON.parse(data.inlineImages)).toHaveLength(2);
        expect(JSON.parse(data.inlineAttachments)).toEqual([
            { href: 'https://example.com/doc.pdf', title: 'Doc' },
        ]);
    });

    it('rejects invalid urls with invalid_media', async () => {
        setUserPlanForTests('media-user', 'free');

        const res = await app.handle(request({ inlineImages: ['not-a-url'] }, 'media-user'));

        expect(res.status).toBe(400);
        expect((await res.json()).error).toBe('invalid_media');
    });

    it('limits anonymous publishers to 1 inline item per array', async () => {
        expect((await app.handle(request({ inlineImages: urls(1) }))).status).toBe(200);
        expect((await app.handle(request({ inlineImages: urls(2) }))).status).toBe(400);
    });

    it('applies per-plan inline limits (free=3, pulse=5, beam=15)', async () => {
        const cases: Array<[string, 'beam' | 'free' | 'pulse', number]> = [
            ['free-user', 'free', 3],
            ['pulse-user', 'pulse', 5],
            ['beam-user', 'beam', 15],
        ];

        for (const [userId, plan, limit] of cases) {
            setUserPlanForTests(userId, plan);

            const atLimit = await app.handle(request({ inlineImages: urls(limit) }, userId));
            const overLimit = await app.handle(request({ inlineImages: urls(limit + 1) }, userId));

            expect(atLimit.status).toBe(200);
            expect(overLimit.status).toBe(400);
        }
    });

    it('caps inlineImages and inlineAttachments independently', async () => {
        setUserPlanForTests('free-user', 'free');

        const res = await app.handle(
            request({ inlineAttachments: urls(3), inlineImages: urls(3) }, 'free-user'),
        );

        expect(res.status).toBe(200);
    });
});
