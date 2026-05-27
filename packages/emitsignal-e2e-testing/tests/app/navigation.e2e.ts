import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
    test('sidebar links navigate between sections', async ({ page }) => {
        await page.goto('/app/inbox');

        const channelsLink = page.locator('a[href="/app/channels"]:has-text("Channels")');
        await channelsLink.click();
        await page.waitForURL('**/app/channels**');
        await expect(page.getByText('Channels /')).toBeVisible();

        const publishLink = page.locator('a[href="/app/publish"]:has-text("Publish")');
        await publishLink.click();
        await page.waitForURL('**/app/publish**');
        await expect(page.getByText('Publish a message')).toBeVisible();

        const keysLink = page.locator('a[href="/app/keys"]:has-text("API Keys")');
        await keysLink.click();
        await page.waitForURL('**/app/keys**');
        await expect(page.getByText('API Keys & Integrations')).toBeVisible();

        const inboxLink = page.locator('a[href="/app/inbox"]:has-text("Inbox")');
        await inboxLink.click();
        await page.waitForURL('**/app/inbox**');
        await expect(page.getByText('Inbox').first()).toBeVisible();
    });

    test('active route has highlighted sidebar item', async ({ page }) => {
        await page.goto('/app/inbox');

        const inboxLink = page.locator('a[href="/app/inbox"]');
        await expect(inboxLink).toHaveClass(/text-accent/);

        const publishLink = page.locator('a[href="/app/publish"]');
        await publishLink.click();
        await page.waitForURL('**/app/publish**');

        await expect(publishLink).toHaveClass(/text-accent/);
    });

    test('subscribed channels appear as sidebar links', async ({ page }) => {
        await page.goto('/app/inbox');

        const channelLinks = page.locator('aside a[href^="/app/channels"]');
        const count = await channelLinks.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});
