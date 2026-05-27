import { baseConfig } from './eslint.base.mjs';

export default [
    ...baseConfig,
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.expo/**',
            '**/coverage/**',
            '**/prisma/migrations/**',
            '**/src/generated/**',
            '**/*.config.js',
            '**/*.config.mjs',
            '**/playwright-report/**',
            '**/test-results/**',
        ],
    },
];
