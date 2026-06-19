import expoConfig from 'eslint-config-expo/flat.js';
import { defineConfig } from 'eslint/config';

import { baseConfig } from '../../eslint.base.mjs';

// eslint-config-expo (SDK 56) registers the `@typescript-eslint` plugin, which
// the shared base config also registers via typescript-eslint. Flat config
// rejects a plugin being defined twice, so drop Expo's duplicate registration
// and let the base's stand — it's the same underlying package, so Expo's
// `@typescript-eslint/*` rules still resolve.
const expoConfigWithoutDuplicateTsPlugin = expoConfig.map((config) => {
    if (config.plugins && '@typescript-eslint' in config.plugins) {
        const { '@typescript-eslint': _duplicate, ...remainingPlugins } = config.plugins;
        return { ...config, plugins: remainingPlugins };
    }
    return config;
});

export default defineConfig([
    ...baseConfig,
    ...expoConfigWithoutDuplicateTsPlugin,
    {
        ignores: ['dist/*', '.expo/*', 'node_modules/*'],
    },
]);
