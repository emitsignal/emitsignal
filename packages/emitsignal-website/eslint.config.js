import js from '@eslint/js';
import unicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: { unicorn },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            'unicorn/catch-error-name': ['error', { name: 'error' }],
            'unicorn/prevent-abbreviations': [
                'error',
                {
                    replacements: {
                        a: false,
                        args: false,
                        e: false,
                        i: false,
                        p: false,
                        prev: false,
                        props: false,
                        ref: false,
                        rel: false,
                    },
                },
            ],
        },
    },
    {
        // Auto-generated file — skip linting
        ignores: ['src/routeTree.gen.ts'],
    },
);
