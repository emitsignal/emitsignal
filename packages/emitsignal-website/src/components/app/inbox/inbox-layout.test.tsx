import { cleanup, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { InboxLayout } from './inbox-layout';

const feed = {
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    loading: true,
    messages: [] as unknown[],
    subscriptions: [] as unknown[],
};

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('#/hooks/use-emit-signal', () => ({ useFeed: () => feed }));
vi.mock('#/ctx/feed-style', () => ({ useFeedStyle: () => ({ feedStyle: 'comfy' }) }));
vi.mock('#/ctx/subscriptions', () => ({ useSubscriptions: () => ({ subscribe: vi.fn() }) }));
vi.mock('#/ctx/toast', () => ({ useToast: () => vi.fn() }));
vi.mock('#/ctx/debug-sections', () => ({ useDebugSections: () => ({ sections: {} }) }));

describe('InboxLayout first load', () => {
    beforeEach(() => {
        // Auto-cleanup is not registered in this setup, so a previous render
        // would otherwise leak its skeletons into the next assertion.
        cleanup();

        feed.loading = true;
        feed.messages = [];
    });

    test('shows skeletons instead of the empty state while the feed is pending', () => {
        render(<InboxLayout selectedId={null} />);

        expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
        expect(screen.queryByText(/no messages yet/)).toBeNull();
    });

    test('shows the empty state once the feed has resolved with no messages', () => {
        feed.loading = false;

        render(<InboxLayout selectedId={null} />);

        expect(screen.queryByTestId('skeleton')).toBeNull();
        expect(screen.getByText(/no messages yet/)).toBeDefined();
    });
});
