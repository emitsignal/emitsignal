import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Elysia } from 'elysia';

import { prismaMock } from '#/__tests__/mocks';

const mockBus = { publish: mock(), publishWebhookDelivery: mock(), subscribe: mock() };
const mockPushQueue = { add: mock(() => Promise.resolve()) };

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/event-bus', () => ({ bus: mockBus }));
mock.module('#/lib/queue', () => ({
    pushQueue: mockPushQueue,
    scheduleQueue: { add: mock(() => Promise.resolve()) },
}));
// Header-driven so a leak into other test files behaves like the real module
// (no test header → anonymous).
mock.module('#/http/auth/plugin', () => ({
    resolveUserId: ({ headers }: { headers: Record<string, string | undefined> }) =>
        Promise.resolve(headers['x-test-user-id'] ?? null),
}));

import { receiveWebhook } from '#/http/webhooks/receive';
import { resetUserPlansForTests, setUserPlanForTests } from '#/services/billing/get-user-plan';
import { duration } from '#/utils/duration';

describe('POST /h/:slug link → view action', () => {
    const app = new Elysia().use(receiveWebhook);

    function withTemplateLink(link: string) {
        withTemplate({ link, title: '{{event.name}}' });
    }

    function withTemplate(template: Record<string, string>) {
        prismaMock.webhook.findUnique.mockResolvedValue({
            id: 'wh-1',
            source: 'custom',
            status: 'active',
            template: JSON.stringify(template),
            topicName: 'deploys',
            userId: null,
        });
    }

    function request(payload: unknown) {
        return new Request('http://localhost/h/cw_abc1234', {
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    }

    // The actions column is written as a JSON string; read back what the route stored.
    function storedActions() {
        const calls = prismaMock.message.create.mock.calls;
        const lastCall = calls[calls.length - 1] as unknown as [{ data: Record<string, unknown> }];

        return JSON.parse(lastCall[0].data.actions as string) as unknown[];
    }

    beforeEach(() => {
        prismaMock.message.create.mockClear();
        mockPushQueue.add.mockClear();
        prismaMock.topic.findUnique.mockResolvedValue({
            displayName: 'deploys',
            id: 'topic-1',
            name: 'deploys',
        });
    });

    it('stores a single view action for an http(s) link', async () => {
        withTemplateLink('https://status.dev/{{event.id}}');

        const res = await app.handle(request({ event: { id: '42', name: 'deploy' } }));

        expect(res.status).toBe(200);
        expect(storedActions()).toEqual([
            { label: 'View', type: 'view', url: 'https://status.dev/42' },
        ]);
    });

    it('drops a javascript: link but still delivers the message', async () => {
        withTemplateLink('javascript:alert(1)');

        const res = await app.handle(request({ event: { name: 'deploy' } }));

        expect(res.status).toBe(200);
        expect(storedActions()).toEqual([]);
    });

    it('drops a relative link but still delivers the message', async () => {
        withTemplateLink('/repos/acme/api');

        const res = await app.handle(request({ event: { name: 'deploy' } }));

        expect(res.status).toBe(200);
        expect(storedActions()).toEqual([]);
    });

    it('stores no action when the link template does not resolve', async () => {
        withTemplateLink('{{event.url}}');

        const res = await app.handle(request({ event: { name: 'deploy' } }));

        expect(res.status).toBe(200);
        expect(storedActions()).toEqual([]);
    });

    it('stores no action when the template has no link at all', async () => {
        prismaMock.webhook.findUnique.mockResolvedValue({
            id: 'wh-1',
            source: 'custom',
            status: 'active',
            template: JSON.stringify({ title: '{{event.name}}' }),
            topicName: 'deploys',
            userId: null,
        });

        const res = await app.handle(request({ event: { name: 'deploy' } }));

        expect(res.status).toBe(200);
        expect(storedActions()).toEqual([]);
    });

    it('stores no action for an untemplated passthrough delivery', async () => {
        prismaMock.webhook.findUnique.mockResolvedValue({
            id: 'wh-1',
            source: 'custom',
            status: 'active',
            template: null,
            topicName: 'deploys',
            userId: null,
        });

        const res = await app.handle(request({ event: { name: 'deploy' } }));

        expect(res.status).toBe(200);
        expect(storedActions()).toEqual([]);
    });

    it('forwards the same action to the push job', async () => {
        withTemplateLink('https://status.dev/run');

        await app.handle(request({ event: { name: 'deploy' } }));

        const calls = mockPushQueue.add.mock.calls;
        const lastCall = calls[calls.length - 1] as unknown as [string, Record<string, unknown>];

        expect(lastCall[0]).toBe('push-message');
        expect(lastCall[1].actions).toEqual([
            { label: 'View', type: 'view', url: 'https://status.dev/run' },
        ]);
    });

    it('uses a templated link label as the button text', async () => {
        withTemplate({ link: 'https://status.dev/run', linkLabel: 'Open {{event.name}}' });

        const res = await app.handle(request({ event: { name: 'deploy' } }));

        expect(res.status).toBe(200);
        expect(storedActions()).toEqual([
            { label: 'Open deploy', type: 'view', url: 'https://status.dev/run' },
        ]);
    });

    it('falls back to View when the label template does not resolve', async () => {
        withTemplate({ link: 'https://status.dev/run', linkLabel: '{{event.label}}' });

        await app.handle(request({ event: { name: 'deploy' } }));

        expect(storedActions()).toEqual([
            { label: 'View', type: 'view', url: 'https://status.dev/run' },
        ]);
    });

    it('collapses and caps a label the payload blew up', async () => {
        withTemplate({ link: 'https://status.dev/run', linkLabel: '{{event.name}}' });

        const res = await app.handle(request({ event: { name: `a\n${'b'.repeat(200)}` } }));

        const [action] = storedActions() as [{ label: string }];

        expect(res.status).toBe(200);
        expect(action.label).toBe(`a ${'b'.repeat(38)}`);
    });

    it('ignores a label when the link itself is dropped', async () => {
        withTemplate({ link: 'javascript:alert(1)', linkLabel: 'Open dashboard' });

        const res = await app.handle(request({ event: { name: 'deploy' } }));

        expect(res.status).toBe(200);
        expect(storedActions()).toEqual([]);
    });
});

describe('POST /h/:slug delivery retention', () => {
    const app = new Elysia().use(receiveWebhook);

    function request() {
        return new Request('http://localhost/h/cw_abc1234', {
            body: JSON.stringify({ event: { name: 'deploy' } }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    }

    // Days between the stored delivery's expiry and now, rounded to whole days.
    function storedExpiryDays(): number {
        const calls = prismaMock.webhookDelivery.create.mock.calls;
        const lastCall = calls[calls.length - 1] as unknown as [{ data: Record<string, unknown> }];
        const expiresAt = lastCall[0].data.expiresAt as Date;

        return Math.round((expiresAt.getTime() - Date.now()) / duration.days(1).as('ms'));
    }

    function withOwner(userId: null | string) {
        prismaMock.webhook.findUnique.mockResolvedValue({
            id: 'wh-1',
            source: 'custom',
            status: 'active',
            template: null,
            topicName: 'deploys',
            userId,
        });
    }

    beforeEach(() => {
        resetUserPlansForTests();
        prismaMock.webhookDelivery.create.mockClear();
        prismaMock.topic.findUnique.mockResolvedValue({
            displayName: 'deploys',
            id: 'topic-1',
            name: 'deploys',
        });
    });

    it('expires a free owner’s delivery after 3 days', async () => {
        withOwner('user-free');
        setUserPlanForTests('user-free', 'free');

        const res = await app.handle(request());

        expect(res.status).toBe(200);
        expect(storedExpiryDays()).toBe(3);
    });

    it('expires a beam owner’s delivery after 30 days, unlike their messages', async () => {
        withOwner('user-beam');
        setUserPlanForTests('user-beam', 'beam');

        await app.handle(request());

        expect(storedExpiryDays()).toBe(30);
    });

    it('expires an unowned webhook’s delivery on the anonymous window', async () => {
        withOwner(null);

        await app.handle(request());

        expect(storedExpiryDays()).toBe(3);
    });
});
