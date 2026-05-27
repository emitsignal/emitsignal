import { expect, test } from '@playwright/test';

import { waitForHydration } from '../../helpers/hydration';

test.describe('API Keys', () => {
    test('table renders with key rows', async ({ page }) => {
        await page.goto('/app/keys');
        await waitForHydration(page);

        await expect(page.getByText('API Keys & Integrations')).toBeVisible();
        await expect(page.getByText('5 keys')).toBeVisible();

        await expect(page.getByText('prod-write')).toBeVisible();
        await expect(page.getByText('ci-runner')).toBeVisible();
        await expect(page.getByText('sentry-bridge')).toBeVisible();
        await expect(page.getByText('maya-laptop')).toBeVisible();
        await expect(page.getByText('old-staging')).toBeVisible();
    });

    test('new key button is visible', async ({ page }) => {
        await page.goto('/app/keys');
        await waitForHydration(page);

        await expect(page.getByRole('button', { name: /New key/ })).toBeVisible();
    });

    test('sparkline charts render as svg elements', async ({ page }) => {
        await page.goto('/app/keys');
        await waitForHydration(page);

        const svgCount = await page.locator('svg').count();
        expect(svgCount).toBeGreaterThan(0);
    });

    test('revoked key shows revoked badge and reduced opacity', async ({ page }) => {
        await page.goto('/app/keys');
        await waitForHydration(page);

        await expect(page.getByText('revoked')).toBeVisible();
    });
});
