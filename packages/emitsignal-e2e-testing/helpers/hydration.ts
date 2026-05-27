import type { Page } from '@playwright/test';

export async function waitForHydration(page: Page): Promise<void> {
    await page.waitForFunction(
        () => {
            const allKeys = Object.getOwnPropertyNames(document.documentElement);
            return allKeys.some((key) => key.startsWith('__reactFiber'));
        },
        { timeout: 15_000 },
    );
}
