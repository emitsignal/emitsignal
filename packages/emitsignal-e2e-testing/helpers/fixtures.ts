import { test as base, expect } from '@playwright/test';

type Fixtures = {
    withDevice: (deviceId: string) => Promise<void>;
};

export const test = base.extend<Fixtures>({
    withDevice: async ({ page }, use) => {
        await use(async (deviceId: string) => {
            await page.addInitScript((id: string) => {
                localStorage.setItem('@emitsignal/device_id', id);
            }, deviceId);
        });
    },
});

export { expect };
