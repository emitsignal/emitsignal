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
            '**/android/**',
            '**/build/**',
            '**/coverage/**',
            '**/dist/**',
            '**/ios/**',
            '**/node_modules/**',
            '**/playwright-report/**',
            '**/prisma/migrations/**',
            '**/src/generated/**',
            '**/test-results/**',
        ],
    },
];
