import { defineConfig } from '@playwright/test';

export default defineConfig({
    expect: { timeout: 10_000 },
    globalSetup: './global-setup.ts',
    globalTeardown: './global-teardown.ts',
    projects: [
        {
            name: 'setup',
            testMatch: /(auth\/.*|app\/auth-guard)\.e2e\.ts/,
        },
        {
            dependencies: ['setup'],
            name: 'app',
            testMatch: /app\/(?!auth-guard).*\.e2e\.ts/,
            use: { storageState: 'playwright/.auth/user.json' },
        },
    ],
    reporter: [['list'], ['html', { open: 'never' }]],
    retries: process.env.CI ? 2 : 0,
    testDir: './tests',
    testMatch: '**/*.e2e.ts',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:5173',
        browserName: 'chromium',
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },
    webServer: [
        {
            command: 'bun --env-file=.env.test run src/index.ts',
            cwd: '../emitsignal-server',
            port: 5001,
            reuseExistingServer: !process.env.CI,
            // stderr: 'pipe',
            // stdout: 'pipe',
            timeout: 30_000,
        },
        {
            command: 'bunx vite --port 5173',
            cwd: '../emitsignal-website',
            env: {
                VITE_API_URL: 'http://localhost:5001',
            },
            port: 5173,
            reuseExistingServer: !process.env.CI,
            // stderr: 'pipe',
            // stdout: 'pipe',
            timeout: 30_000,
        },
    ],

    workers: 1,
});
