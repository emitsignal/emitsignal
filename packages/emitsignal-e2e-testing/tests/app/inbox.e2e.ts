import { api, createSession } from '../../helpers/api';
import { expect, test } from '../../helpers/fixtures';
import { waitForHydration } from '../../helpers/hydration';

test.describe('Inbox', () => {
    test.beforeAll(async () => {
        await createSession(`inbox-${Date.now()}@test.com`);
    });

    test('empty state shows no messages prompt', async ({ page }) => {
        await page.goto('/app/inbox');
        await waitForHydration(page);

        await expect(page.getByText('no messages yet')).toBeVisible();
        await expect(page.getByText('subscribe to a channel')).toBeVisible();
    });

    test('message list renders subscribed channel messages', async ({ page, withDevice }) => {
        const topicName = `inbox-topic-${Date.now()}`;
        const deviceId = 'e2e-device-inbox';

        await withDevice(deviceId);

        await api.subscribe(deviceId, topicName);
        await api.publish(topicName, {
            body: 'Test body one',
            priority: 3,
            tags: ['test'],
            title: 'Test Message One',
        });
        await api.publish(topicName, {
            body: 'Test body two',
            priority: 5,
            tags: ['alert'],
            title: 'Critical Alert',
        });

        await page.goto('/app/inbox');
        await waitForHydration(page);

        await expect(page.getByText('Test Message One')).toBeVisible();
        await expect(page.getByText('Critical Alert')).toBeVisible();
        await expect(page.getByText(topicName).first()).toBeVisible();
    });

    test('clicking a message navigates to detail view', async ({ page, withDevice }) => {
        const topicName = `inbox-click-${Date.now()}`;
        const deviceId = 'e2e-device-inbox-click';

        await withDevice(deviceId);

        await api.subscribe(deviceId, topicName);
        const { messageId } = await api.publish(topicName, {
            body: 'Detail body',
            priority: 2,
            tags: [],
            title: 'Clickable Message',
        });

        await page.goto('/app/inbox');
        await waitForHydration(page);

        await page.getByTestId('notification-row').filter({ hasText: 'Clickable Message' }).click();

        await page.waitForURL(`**/app/inbox/${messageId}**`);
        await expect(page.getByText('Detail body').first()).toBeVisible();
    });

    test('SSE delivers new message in real time', async ({ page, withDevice }) => {
        const topicName = `inbox-sse-${Date.now()}`;
        const deviceId = 'e2e-device-inbox-sse';

        await withDevice(deviceId);

        await api.subscribe(deviceId, topicName);
        await api.publish(topicName, {
            body: 'Initial message',
            priority: 3,
            tags: [],
            title: 'Initial',
        });

        await page.goto('/app/inbox');
        await waitForHydration(page);

        await expect(page.getByText('Initial', { exact: true })).toBeVisible();

        await api.publish(topicName, {
            body: 'Live message body',
            priority: 1,
            tags: ['live'],
            title: 'Live Update',
        });

        await expect(page.getByText('Live Update')).toBeVisible({ timeout: 15_000 });
    });

    test('subscribe action adds a new channel', async ({ page }) => {
        await page.goto('/app/inbox');
        await waitForHydration(page);

        await page.locator('button:has-text("subscribe")').click();

        const input = page.getByPlaceholder('topic/name');
        await expect(input).toBeVisible();

        const topicName = `inbox-sub-${Date.now()}`;
        await input.fill(topicName);
        await page.getByRole('button', { name: /add/ }).click();

        await expect(page.getByText(topicName)).toBeVisible({ timeout: 10_000 });
    });
});
