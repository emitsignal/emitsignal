import { expect, test } from '@playwright/test';

import { api, createSession } from '../../helpers/api';
import { waitForHydration } from '../../helpers/hydration';

test.describe('Publish', () => {
    test.beforeAll(async () => {
        await createSession(`publish-${Date.now()}@test.com`);
        const deviceId = 'e2e-device-publish';
        const topicName = `pub-suggest-${Date.now()}`;
        await api.subscribe(deviceId, topicName);
    });

    test('filling form fields reflects in inputs', async ({ page }) => {
        await page.goto('/app/publish');
        await waitForHydration(page);

        const topicInput = page.getByPlaceholder('deploy/prod');
        await topicInput.fill('my-topic');
        await expect(topicInput).toHaveValue('my-topic');

        const titleInput = page.getByPlaceholder(/Deploy succeeded/);
        await titleInput.fill('Test Title');
        await expect(titleInput).toHaveValue('Test Title');

        const bodyInput = page.getByPlaceholder('Describe your message');
        await bodyInput.fill('Test body content');
        await expect(bodyInput).toHaveValue('Test body content');
    });

    test('priority toggle switches selected priority', async ({ page }) => {
        await page.goto('/app/publish');
        await waitForHydration(page);

        await page.getByRole('button', { exact: true, name: 'p5' }).click();
        await expect(page.getByRole('button', { exact: true, name: 'p5' })).toHaveClass(
            /bg-accent\/10/,
        );

        await page.getByRole('button', { exact: true, name: 'p1' }).click();
        await expect(page.getByRole('button', { exact: true, name: 'p1' })).toHaveClass(
            /bg-accent\/10/,
        );
    });

    test('adding and removing tags', async ({ page }) => {
        await page.goto('/app/publish');
        await waitForHydration(page);

        const tagInput = page.getByTestId('tag-input');

        await tagInput.fill('urgent');
        await tagInput.press('Enter');
        await expect(page.getByText('urgent').first()).toBeVisible();

        await tagInput.fill('deploy');
        await tagInput.press('Enter');
        await expect(page.getByText('deploy')).toBeVisible();

        await page.getByText('urgent').locator('button').click();
        await expect(page.getByText('urgent')).not.toBeVisible();
    });

    test('publish success shows confirmation', async ({ page }) => {
        await page.goto('/app/publish');
        await waitForHydration(page);

        await page.getByPlaceholder('deploy/prod').fill(`pub-success-${Date.now()}`);
        await page.getByPlaceholder(/Deploy succeeded/).fill('Success Test');
        await page.getByPlaceholder('Describe your message').fill('This is a test publish');

        await page.getByRole('button', { name: /Send signal/ }).click();

        await expect(page.getByText('message published')).toBeVisible({ timeout: 10_000 });
    });

    test('publish button is disabled when fields are empty', async ({ page }) => {
        await page.goto('/app/publish');
        await waitForHydration(page);

        await expect(page.getByRole('button', { name: /Send signal/ })).toBeDisabled();
    });

    test('curl preview shows in side panel', async ({ page }) => {
        await page.goto('/app/publish');
        await waitForHydration(page);

        await expect(page.getByText('curl').first()).toBeVisible();
    });

    test('delivery chips show expected options', async ({ page }) => {
        await page.goto('/app/publish');
        await waitForHydration(page);

        await expect(page.getByText('push · all subs')).toBeVisible();
        await expect(page.getByText('email · p>=4')).toBeVisible();
        await expect(page.getByText('slack #releases')).toBeVisible();
        await expect(page.getByText('sms · on-call')).toBeVisible();
        await expect(page.getByText('webhook → datadog')).toBeVisible();
    });
});
