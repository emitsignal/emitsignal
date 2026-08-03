import { describe, expect, it, mock } from 'bun:test';

import { fileStorageMock, prismaMock } from '#/__tests__/mocks';

mock.module('#/lib/prisma', () => ({ prisma: prismaMock }));
mock.module('#/lib/storage', () => ({ FileStorageService: fileStorageMock }));

import { serializeMessage } from '#/services/message';

describe('serializeMessage', () => {
    const dbMessage = {
        actions: JSON.stringify([{ type: 'acknowledge' }]),
        body: 'Hello',
        createdAt: new Date(1000000000000),
        id: 'msg-1',
        priority: 3,
        tags: ['test'],
        title: 'Test',
        topicId: 'topic-1',
    };

    it('converts a DB message to API format', async () => {
        const result = await serializeMessage(dbMessage, 5);

        expect(result).toEqual({
            acknowledgmentCount: 5,
            actions: [{ type: 'acknowledge' }],
            attachments: [],
            bannerImage: null,
            body: 'Hello',
            createdAt: 1000000000000,
            id: 'msg-1',
            inlineAttachments: [],
            inlineImages: [],
            priority: 3,
            tags: ['test'],
            title: 'Test',
            topicId: 'topic-1',
        });
    });

    it('includes attachments with URLs when present', async () => {
        prismaMock.attachment.findMany.mockResolvedValueOnce([
            {
                filename: 'screenshot.png',
                mimeType: 'image/png',
                size: 1024,
                storageKey: 'abc.png',
            },
        ]);

        fileStorageMock.provider.getUrl.mockResolvedValueOnce('https://example.com/abc.png');

        const result = await serializeMessage(dbMessage, 0, true);

        expect(result.attachments).toEqual([
            {
                filename: 'screenshot.png',
                mimeType: 'image/png',
                size: 1024,
                storageKey: 'abc.png',
                url: 'https://example.com/abc.png',
            },
        ]);
    });

    it('defaults acknowledgmentCount to 0', async () => {
        const result = await serializeMessage({
            actions: '[]',
            body: '',
            createdAt: new Date(0),
            id: 'msg-1',
            priority: 1,
            tags: [],
            title: '',
            topicId: 't1',
        });
        expect(result.acknowledgmentCount).toBe(0);
        expect(result.attachments).toEqual([]);
    });
});
