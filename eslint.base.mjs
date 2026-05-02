import js from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import ts from "typescript-eslint";

export const baseConfig = ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    perfectionist.configs["recommended-alphabetical"],
    prettierRecommended,
    {
        rules: {
            "prettier/prettier": "warn",
        },
    },
);

export default ts.config(...baseConfig, {
    ignores: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.expo/**",
        "**/coverage/**",
        "**/prisma/migrations/**",
        "**/src/generated/**",
        "**/*.config.js",
        "**/*.config.mjs",
    ],
});
