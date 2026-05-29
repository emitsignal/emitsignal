import { baseConfig } from './eslint.base.mjs';

export default [
    ...baseConfig,
    {
        ignores: [
            '**/.expo/**',
            '**/.output/**',
            '**/.tanstack/**',
            '**/*.config.js',
            '**/*.config.mjs',
            '**/build/**',
            '**/coverage/**',
            '**/dist/**',
            '**/node_modules/**',
            '**/playwright-report/**',
            '**/prisma/migrations/**',
            '**/src/generated/**',
            '**/test-results/**',
        ],
    },
];
