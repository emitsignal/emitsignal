import type { Message } from '@emitsignal/shared/api';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ShareDialog } from './share-dialog';

const getTopic = vi.fn();
const updateTopic = vi.fn();

vi.mock('#/lib/api', () => ({
    api: {
        getTopic: (...args: unknown[]) => getTopic(...args),
        updateTopic: (...args: unknown[]) => updateTopic(...args),
    },
}));

vi.mock('#/lib/site-origin', () => ({ useSiteOrigin: () => 'https://emitsignal.com' }));

const message = {
    acknowledgmentCount: 0,
    actions: [],
    attachments: [],
    bannerImage: null,
    body: 'webhooks 3x faster',
    createdAt: 1700000000000,
    id: 'msg-1',
    inlineAttachments: [],
    inlineImages: [],
    priority: 3,
    tags: [],
    title: 'Acme API v4.2',
    topicId: 'topic-1',
    topicName: 'acme/releases',
} as unknown as Message;

const noop = () => {};

describe('ShareDialog', () => {
    beforeEach(() => {
        cleanup();
        getTopic.mockReset();
        updateTopic.mockReset();
    });

    test('renders nothing while idle', () => {
        const { container } = render(
            <ShareDialog
                message={message}
                onClose={noop}
                onRetry={noop}
                state={{ kind: 'idle' }}
            />,
        );

        expect(container.innerHTML).toBe('');
    });

    test('shows the public share URL once a share id exists', () => {
        render(
            <ShareDialog
                message={message}
                onClose={noop}
                onRetry={noop}
                state={{ kind: 'ready', shareId: 'kx8f2a99' }}
            />,
        );

        expect(screen.getByText('emitsignal.com/s/kx8f2a99')).toBeTruthy();
        expect(screen.getByText('public')).toBeTruthy();
    });

    test('appends the payload flag to the copied link when the toggle is on', () => {
        render(
            <ShareDialog
                message={message}
                onClose={noop}
                onRetry={noop}
                state={{ kind: 'ready', shareId: 'kx8f2a99' }}
            />,
        );

        fireEvent.click(screen.getByRole('checkbox'));

        expect(screen.getByText('emitsignal.com/s/kx8f2a99?payload=1')).toBeTruthy();
    });

    test('shows the private branch and offers to make the topic public for an owner', async () => {
        getTopic.mockResolvedValue({ isOwner: true, name: 'acme/releases' });

        render(
            <ShareDialog
                message={message}
                onClose={noop}
                onRetry={noop}
                state={{ accessMode: 'private', kind: 'private', topicName: 'acme/releases' }}
            />,
        );

        expect(screen.getByText('This topic is private')).toBeTruthy();

        await waitFor(() => expect(screen.getByText('Make topic public')).toBeTruthy());
    });

    // A non-owner would just get a 403 from the API, so the button must not appear.
    test('hides the make-public button for a non-owner', async () => {
        getTopic.mockResolvedValue({ isOwner: false, name: 'acme/releases' });

        render(
            <ShareDialog
                message={message}
                onClose={noop}
                onRetry={noop}
                state={{ accessMode: 'private', kind: 'private', topicName: 'acme/releases' }}
            />,
        );

        await waitFor(() => expect(getTopic).toHaveBeenCalled());

        expect(screen.queryByText('Make topic public')).toBeNull();
    });
});
