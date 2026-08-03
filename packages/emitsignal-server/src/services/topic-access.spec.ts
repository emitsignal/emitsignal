import { beforeEach, describe, expect, it, mock } from 'bun:test';

import { prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));

import { resolveTopicCapabilities } from './topic-access';

describe('resolveTopicCapabilities', () => {
    beforeEach(() => {
        prismaMock.topicAccess.findUnique.mockReset();
        prismaMock.topicAccess.findUnique.mockResolvedValue(null);
    });

    it('treats unclaimed topics as fully open', async () => {
        const capabilities = await resolveTopicCapabilities(
            { accessMode: 'private', id: 't1', ownerId: null },
            'user-1',
        );

        expect(capabilities).toEqual({
            canPublish: true,
            canRead: true,
            isOwner: false,
            role: null,
        });
        expect(prismaMock.topicAccess.findUnique).not.toHaveBeenCalled();
    });

    it('gives the owner full access without a membership lookup', async () => {
        const capabilities = await resolveTopicCapabilities(
            { accessMode: 'private', id: 't1', ownerId: 'owner-1' },
            'owner-1',
        );

        expect(capabilities.isOwner).toBe(true);
        expect(capabilities.canRead).toBe(true);
        expect(capabilities.canPublish).toBe(true);
        expect(prismaMock.topicAccess.findUnique).not.toHaveBeenCalled();
    });

    it('public claimed topic: anyone reads and publishes', async () => {
        const capabilities = await resolveTopicCapabilities(
            { accessMode: 'public', id: 't1', ownerId: 'owner-1' },
            'stranger',
        );

        expect(capabilities.canRead).toBe(true);
        expect(capabilities.canPublish).toBe(true);
    });

    it('readonly claimed topic: non-member reads but cannot publish', async () => {
        const capabilities = await resolveTopicCapabilities(
            { accessMode: 'readonly', id: 't1', ownerId: 'owner-1' },
            'stranger',
        );

        expect(capabilities.canRead).toBe(true);
        expect(capabilities.canPublish).toBe(false);
    });

    it('private claimed topic: non-member can neither read nor publish', async () => {
        const capabilities = await resolveTopicCapabilities(
            { accessMode: 'private', id: 't1', ownerId: 'owner-1' },
            'stranger',
        );

        expect(capabilities.canRead).toBe(false);
        expect(capabilities.canPublish).toBe(false);
    });

    it('private claimed topic: a publisher member reads and publishes', async () => {
        prismaMock.topicAccess.findUnique.mockResolvedValueOnce({ role: 'publisher' });

        const capabilities = await resolveTopicCapabilities(
            { accessMode: 'private', id: 't1', ownerId: 'owner-1' },
            'member-1',
        );

        expect(capabilities.canRead).toBe(true);
        expect(capabilities.canPublish).toBe(true);
        expect(capabilities.role).toBe('publisher');
    });

    it('readonly claimed topic: a subscriber member reads but cannot publish', async () => {
        prismaMock.topicAccess.findUnique.mockResolvedValueOnce({ role: 'subscriber' });

        const capabilities = await resolveTopicCapabilities(
            { accessMode: 'readonly', id: 't1', ownerId: 'owner-1' },
            'member-1',
        );

        expect(capabilities.canRead).toBe(true);
        expect(capabilities.canPublish).toBe(false);
    });

    it('anonymous caller is never a member of a claimed topic', async () => {
        const capabilities = await resolveTopicCapabilities(
            { accessMode: 'private', id: 't1', ownerId: 'owner-1' },
            null,
        );

        expect(capabilities.canRead).toBe(false);
        expect(prismaMock.topicAccess.findUnique).not.toHaveBeenCalled();
    });
});
