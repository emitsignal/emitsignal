import expoConfig from 'eslint-config-expo/flat.js';
import { defineConfig } from 'eslint/config';

import { baseConfig } from '../../eslint.base.mjs';

export default defineConfig([
    ...baseConfig,
    ...expoConfig,
    {
        ignores: ['dist/*', '.expo/*', 'node_modules/*'],
    },
]);
