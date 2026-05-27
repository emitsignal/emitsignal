import { expect, test as setup } from '@playwright/test';

import { api, waitForServer } from '../../helpers/api';
import { waitForHydration } from '../../helpers/hydration';

const AUTH_FILE = 'playwright/.auth/user.json';

const TEST_EMAIL = `e2e-test-${Date.now()}@emitsignal.test`;

setup('full sign-in flow saves auth state', async ({ page }) => {
    await waitForServer();

    const { devCode } = await api.requestMagicLink(TEST_EMAIL);

    if (!devCode) {
        throw new Error('devCode not returned — is NODE_ENV=development?');
    }

    await page.goto(`/verify?email=${encodeURIComponent(TEST_EMAIL)}&devCode=${devCode}`);
    await waitForHydration(page);

    await expect(page.getByRole('button', { name: /verify/ })).toBeEnabled({ timeout: 15_000 });

    await page.getByRole('button', { name: /verify/ }).click();

    await page.waitForURL('**/app/inbox**', { timeout: 15_000 });

    await expect(page.locator('main')).toBeVisible();

    await page.context().storageState({ path: AUTH_FILE });
});

setup('verify with wrong code shows error', async ({ page }) => {
    await page.goto(`/verify?email=${encodeURIComponent(TEST_EMAIL)}&devCode=`);
    await waitForHydration(page);

    await page.locator('input[maxlength="6"]').fill('xxxxxx', { force: true });

    await page.getByRole('button', { name: /verify/ }).click();

    await expect(page.getByText(/invalid_or_expired_code/)).toBeVisible({ timeout: 10_000 });
});
