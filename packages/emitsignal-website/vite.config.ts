import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { defineConfig } from 'vite';

import { remarkExtractHeadings } from './src/lib/remark-extract-headings';

const config = defineConfig({
    optimizeDeps: {
        exclude: ['@resvg/resvg-js'],
    },
    plugins: [
        devtools(),
        nitro({
            traceDeps: ['@resvg/resvg-js*'],
        }),
        tailwindcss(),
        {
            enforce: 'pre',
            ...mdx({
                rehypePlugins: [rehypeSlug],
                remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkExtractHeadings],
            }),
        },
        tanstackStart(),
        viteReact(),
    ],
    resolve: {
        dedupe: ['@tanstack/react-query', 'react', 'react-dom'],
        tsconfigPaths: true,
    },
    ssr: {
        // Externalized in SSR, this package resolves `@tanstack/react-query` through Node
        // from the hoisted root copy, bypassing `resolve.dedupe` — its QueryClientProvider
        // then lands in a different module instance than the one `src/` imports, so every
        // server-side `useQueryClient()` throws "No QueryClient set".
        noExternal: ['@tanstack/react-router-ssr-query'],
    },
});

export default config;
