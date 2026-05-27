import { api, createSession } from '../../helpers/api';
import { expect, test } from '../../helpers/fixtures';
import { waitForHydration } from '../../helpers/hydration';

test.describe('Inbox Message Detail', () => {
    let messageId: string;
    let topicName: string;
    let deviceId: string;

    test.beforeAll(async () => {
        await createSession(`detail-${Date.now()}@test.com`);

        topicName = `detail-${Date.now()}`;
        deviceId = 'e2e-device-detail';

        await api.subscribe(deviceId, topicName);
        const result = await api.publish(topicName, {
            body: 'Message body for preview',
            priority: 4,
            tags: ['error', 'critical'],
            title: 'Preview Title',
        });
        messageId = result.messageId;
    });

    test('preview panel shows priority, title, body, and tags', async ({ page, withDevice }) => {
        await withDevice(deviceId);
        await page.goto(`/app/inbox/${messageId}`);
        await waitForHydration(page);

        await expect(page.getByText('Preview Title').first()).toBeVisible();
        await expect(page.getByText('Message body for preview').first()).toBeVisible();
        await expect(page.getByText('error', { exact: true })).toBeVisible();
        await expect(page.getByText('critical', { exact: true })).toBeVisible();
        await expect(page.getByText('PRIORITY 4')).toBeVisible();
    });

    test('acknowledge button is visible for messages with acknowledge action', async ({
        page,
        withDevice,
    }) => {
        const ackTopic = `detail-ack-${Date.now()}`;

        await api.subscribe(deviceId, ackTopic);

        const ackResult = await api.publish(ackTopic, {
            actions: [{ label: 'Acknowledge', type: 'acknowledge' }],
            body: 'Ack message',
            priority: 3,
            tags: [],
            title: 'Acknowledge Me',
        });

        await withDevice(deviceId);
        await page.goto(`/app/inbox/${ackResult.messageId}`);
        await waitForHydration(page);

        await expect(page.getByRole('button', { name: 'Acknowledge' })).toBeVisible();
    });

    test('no acknowledge button when message has no acknowledge action', async ({
        page,
        withDevice,
    }) => {
        await withDevice(deviceId);
        await page.goto(`/app/inbox/${messageId}`);
        await waitForHydration(page);

        await expect(page.getByRole('button', { name: 'Acknowledge' })).not.toBeVisible();
    });

    test('payload panel shows JSON', async ({ page, withDevice }) => {
        await withDevice(deviceId);
        await page.goto(`/app/inbox/${messageId}`);
        await waitForHydration(page);

        await expect(page.locator('pre')).toContainText('"title"');
        await expect(page.locator('pre')).toContainText('"priority"');
    });

    test('metric chart renders an svg', async ({ page, withDevice }) => {
        await withDevice(deviceId);
        await page.goto(`/app/inbox/${messageId}`);
        await waitForHydration(page);

        await expect(page.getByTestId('metric-chart').locator('svg')).toBeVisible();
    });
});
