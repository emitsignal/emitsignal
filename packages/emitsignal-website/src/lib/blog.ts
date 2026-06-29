export interface Author {
    bio: string;
    handle: string;
    id: AuthorId;
    name: string;
    photo?: string;
    role: string;
}
export type AuthorId = 'keven' | 'team';

export interface Category {
    blurb: string;
    color: string;
    key: PostCategory;
    label: string;
}

export type PostCategory = 'changelog' | 'engineering' | 'product' | 'tutorial';

export interface PostFrontmatter {
    author: AuthorId;
    category: PostCategory;
    date: string;
    excerpt: string;
    featured?: boolean;
    readTime: number;
    tags: string[];
    title: string;
    views: number;
}

export interface PostHeading {
    id: string;
    text: string;
}

export interface PostMeta {
    frontmatter: PostFrontmatter;
    headings: PostHeading[];
    slug: string;
}

export const AUTHORS: Record<AuthorId, Author> = {
    keven: {
        bio: 'Team Lead | Software Engineer',
        handle: '@kevenleone',
        id: 'keven',
        name: 'Keven Leone',
        photo: 'https://github.com/kevenleone.png',
        role: 'Project Maintainer',
    },
    team: {
        bio: 'Made by humans, paged by computers.',
        handle: '@emitsignal',
        id: 'team',
        name: 'EmitSignal Team',
        role: 'Made by humans',
    },
};

export const CATEGORIES: Record<PostCategory, Category> = {
    changelog: {
        blurb: 'Every release, every line, dated.',
        color: '#4ade80',
        key: 'changelog',
        label: 'Changelog',
    },
    engineering: {
        blurb: 'How the pipe is built — deep dives from the team.',
        color: '#67e8f9',
        key: 'engineering',
        label: 'Engineering',
    },
    product: {
        blurb: 'New capabilities and the thinking behind them.',
        color: '#a78bfa',
        key: 'product',
        label: 'Product',
    },
    tutorial: {
        blurb: 'Wire a source to a sink in five minutes.',
        color: '#fbbf24',
        key: 'tutorial',
        label: 'Integrations',
    },
};

export function fmtDate(iso: string): string {
    const d = new Date(iso + 'T12:00:00');

    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
