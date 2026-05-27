import { expect, test } from '@playwright/test';

test('authenticated user stays on /app', async ({ page }) => {
    await page.goto('/app');
    await page.waitForURL('**/app/inbox**', { timeout: 15_000 });
    await expect(page.locator('main')).toBeVisible();
});
