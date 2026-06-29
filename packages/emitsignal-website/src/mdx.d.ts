import type { ComponentType } from 'react';

declare module '*.mdx' {
    const MDXComponent: ComponentType;
    export default MDXComponent;

    export const frontmatter: {
        author: 'dex' | 'maya' | 'rhea' | 'sol' | 'team';
        category: 'changelog' | 'engineering' | 'product' | 'tutorial';
        date: string;
        excerpt: string;
        featured?: boolean;
        readTime: number;
        tags: string[];
        title: string;
        views: number;
    };

    export const headings: Array<{ id: string; text: string }>;
}
