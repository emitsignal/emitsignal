import { api, createSession } from '../../helpers/api';
import { expect, test } from '../../helpers/fixtures';
import { waitForHydration } from '../../helpers/hydration';

test.describe('Channels', () => {
    test.beforeAll(async () => {
        await createSession(`channels-${Date.now()}@test.com`);
    });

    test('no topic selected shows placeholder', async ({ page }) => {
        await page.goto('/app/channels');
        await waitForHydration(page);

        await expect(page.getByText('select a channel')).toBeVisible();
    });

    test('channel loads with messages and stats', async ({ page, withDevice }) => {
        const topicName = `chan-${Date.now()}`;
        const deviceId = 'e2e-device-chan';

        await withDevice(deviceId);

        await api.subscribe(deviceId, topicName);
        await api.publish(topicName, {
            body: 'First channel message',
            priority: 3,
            tags: ['deploy'],
            title: 'Deploy Started',
        });
        await api.publish(topicName, {
            body: 'Second channel message',
            priority: 5,
            tags: ['alert'],
            title: 'Outage Detected',
        });

        await page.goto(`/app/channels?topic=${encodeURIComponent(topicName)}`);
        await waitForHydration(page);

        await expect(page.getByText('Deploy Started')).toBeVisible();
        await expect(page.getByText('Outage Detected')).toBeVisible();
        await expect(page.getByText(topicName, { exact: true }).first()).toBeVisible();
        await expect(page.getByText('2 messages', { exact: true })).toBeVisible();
    });

    test('topic pill navigation switches channel', async ({ page, withDevice }) => {
        const topicA = `chan-a-${Date.now()}`;
        const topicB = `chan-b-${Date.now()}`;
        const deviceId = 'e2e-device-pills';

        await withDevice(deviceId);

        await api.subscribe(deviceId, topicA);
        await api.subscribe(deviceId, topicB);

        await api.publish(topicA, {
            body: 'Topic A message',
            priority: 3,
            tags: [],
            title: 'From A',
        });
        await api.publish(topicB, {
            body: 'Topic B message',
            priority: 3,
            tags: [],
            title: 'From B',
        });

        await page.goto(`/app/channels?topic=${encodeURIComponent(topicA)}`);
        await waitForHydration(page);

        await expect(page.getByText('From A')).toBeVisible();
        await expect(page.getByText('From B')).not.toBeVisible();

        await page.getByRole('button', { exact: true, name: topicB }).click();

        await page.waitForURL(`**/app/channels?topic=${encodeURIComponent(topicB)}**`);
        await expect(page.getByText('From B')).toBeVisible();
    });

    test('stats strip shows correct counts', async ({ page, withDevice }) => {
        const topicName = `chan-stats-${Date.now()}`;
        const deviceId = 'e2e-device-stats';

        await withDevice(deviceId);

        await api.subscribe(deviceId, topicName);
        await api.publish(topicName, {
            body: 'Stats message',
            priority: 5,
            tags: [],
            title: 'P5 Event',
        });

        await page.goto(`/app/channels?topic=${encodeURIComponent(topicName)}`);
        await waitForHydration(page);

        await expect(page.getByText('last 24h')).toBeVisible();
        await expect(page.getByText('total messages')).toBeVisible();
        await expect(page.getByText('p5 events')).toBeVisible();
        await expect(page.getByText('subscribers', { exact: true })).toBeVisible();
    });

    test('routing rail is visible', async ({ page, withDevice }) => {
        const topicName = `chan-route-${Date.now()}`;
        const deviceId = 'e2e-device-route';

        await withDevice(deviceId);

        await api.subscribe(deviceId, topicName);
        await api.publish(topicName, {
            body: 'Route test',
            priority: 3,
            tags: [],
            title: 'Route Message',
        });

        await page.goto(`/app/channels?topic=${encodeURIComponent(topicName)}`);
        await waitForHydration(page);

        await expect(page.getByText('ROUTING')).toBeVisible();
    });

    test('SSE delivers new message in channel view', async ({ page, withDevice }) => {
        const topicName = `chan-sse-${Date.now()}`;
        const deviceId = 'e2e-device-chan-sse';

        await withDevice(deviceId);

        await api.subscribe(deviceId, topicName);
        await api.publish(topicName, {
            body: 'Before SSE',
            priority: 3,
            tags: [],
            title: 'Before SSE',
        });

        await page.goto(`/app/channels?topic=${encodeURIComponent(topicName)}`);
        await waitForHydration(page);

        await expect(page.getByText('Before SSE', { exact: true }).first()).toBeVisible();

        await api.publish(topicName, {
            body: 'After SSE push',
            priority: 3,
            tags: ['sse'],
            title: 'After SSE',
        });

        await expect(page.getByText('After SSE', { exact: true }).first()).toBeVisible({
            timeout: 15_000,
        });
    });
});
