import { mock } from 'bun:test';

export const prismaMock = {
    $queryRaw: mock<() => Promise<unknown[]>>(() => Promise.resolve([])),
    acknowledgment: {
        count: mock<() => Promise<number>>(() => Promise.resolve(0)),
        upsert: mock<() => Promise<object>>(() => Promise.resolve({ id: 'ack-1' })),
    },
    attachment: {
        count: mock<() => Promise<number>>(() => Promise.resolve(0)),
        create: mock<
            (args: {
                data: Record<string, unknown>;
                select?: Record<string, boolean>;
            }) => Promise<object>
        >(() => Promise.resolve({ id: 'att-1' })),
        findMany: mock<(args?: Record<string, unknown>) => Promise<object[]>>(() =>
            Promise.resolve([]),
        ),
    },
    message: {
        create: mock<() => Promise<object>>(() =>
            Promise.resolve({
                actions: '[]',
                body: '',
                createdAt: new Date(),
                id: 'msg-1',
                priority: 3,
                scheduledAt: null,
                tags: '[]',
                title: '',
                topicId: 'topic-1',
            }),
        ),
        findMany: mock<() => Promise<object[]>>(() => Promise.resolve([])),
        findUnique: mock<() => Promise<null | object>>(() => Promise.resolve(null)),
    },
    planSubscription: {
        findFirst: mock<(args?: Record<string, unknown>) => Promise<null | object>>(() =>
            Promise.resolve(null),
        ),
    },
    pushToken: {
        findMany: mock<() => Promise<object[]>>(() => Promise.resolve([])),
        findUnique: mock<() => Promise<null | object>>(() => Promise.resolve(null)),
        update: mock<() => Promise<object>>(() =>
            Promise.resolve({
                deviceId: 'd1',
                id: 'pt-1',
                platform: 'ios',
                pushEnabled: true,
            }),
        ),
        upsert: mock<() => Promise<object>>(() => Promise.resolve({ id: 'pt-1' })),
    },
    subscription: {
        delete: mock<() => Promise<object>>(() => Promise.resolve({ id: 'sub-1' })),
        deleteMany: mock<() => Promise<{ count: number }>>(() => Promise.resolve({ count: 0 })),
        findMany: mock<() => Promise<object[]>>(() => Promise.resolve([])),
        findUnique: mock<() => Promise<null | object>>(() => Promise.resolve(null)),
        update: mock<() => Promise<object>>(() =>
            Promise.resolve({
                deviceId: 'd1',
                id: 'sub-1',
                pushEnabled: true,
                settings: '{}',
                topicId: 'topic-1',
            }),
        ),
        updateMany: mock<() => Promise<{ count: number }>>(() => Promise.resolve({ count: 0 })),
        upsert: mock<() => Promise<object>>(() =>
            Promise.resolve({
                deviceId: 'd1',
                id: 'sub-1',
                pushEnabled: true,
                topicId: 'topic-1',
            }),
        ),
    },
    topic: {
        count: mock<(args?: Record<string, unknown>) => Promise<number>>(() => Promise.resolve(0)),
        create: mock<() => Promise<object>>(() =>
            Promise.resolve({
                accessMode: 'public',
                createdAt: new Date(),
                description: '',
                displayName: 'test',
                id: 'topic-1',
                name: 'test',
                ownerId: null,
            }),
        ),
        findMany: mock<() => Promise<object[]>>(() => Promise.resolve([])),
        findUnique: mock<() => Promise<null | object>>(() => Promise.resolve(null)),
        update: mock<() => Promise<object>>(() =>
            Promise.resolve({
                accessMode: 'public',
                createdAt: new Date(),
                description: '',
                displayName: 'test',
                id: 'topic-1',
                name: 'test',
                ownerId: null,
            }),
        ),
        upsert: mock<() => Promise<object>>(() =>
            Promise.resolve({
                createdAt: new Date(),
                id: 'topic-1',
                name: 'test',
            }),
        ),
    },
    topicAccess: {
        create: mock<() => Promise<object>>(() => Promise.resolve({ id: 'ta-1' })),
        deleteMany: mock<() => Promise<{ count: number }>>(() => Promise.resolve({ count: 0 })),
        findUnique: mock<() => Promise<null | object>>(() => Promise.resolve(null)),
        upsert: mock<() => Promise<object>>(() => Promise.resolve({ id: 'ta-1' })),
    },
    user: {
        findUnique: mock<() => Promise<null | object>>(() => Promise.resolve(null)),
        upsert: mock<() => Promise<object>>(() =>
            Promise.resolve({
                email: 'test@test.com',
                id: 'user-1',
                name: null,
            }),
        ),
    },
    verificationCode: {
        create: mock<() => Promise<object>>(() =>
            Promise.resolve({
                code: 'abc123',
                consumed: false,
                createdAt: new Date(),
                email: 'test@test.com',
                expiresAt: new Date(Date.now() + 600_000),
                id: 'vc-1',
            }),
        ),
        findFirst: mock<() => Promise<null | object>>(() => Promise.resolve(null)),
        update: mock<() => Promise<object>>(() => Promise.resolve({ id: 'vc-1' })),
    },
    webhook: {
        count: mock<(args?: Record<string, unknown>) => Promise<number>>(() => Promise.resolve(0)),
        create: mock<(args: { data: Record<string, unknown> }) => Promise<object>>(() =>
            Promise.resolve({
                createdAt: new Date(),
                id: 'wh-1',
                name: 'custom webhook',
                slug: 'cw_abc1234',
                source: 'custom',
                status: 'active',
                template: null,
                topicName: 'deploys',
            }),
        ),
        findUnique: mock<(args?: Record<string, unknown>) => Promise<null | object>>(() =>
            Promise.resolve(null),
        ),
    },
    webhookDelivery: {
        create: mock<(args: { data: Record<string, unknown> }) => Promise<object>>(() =>
            Promise.resolve({ createdAt: new Date(), id: 'whd-1' }),
        ),
    },
};

export const fileStorageMock = {
    provider: {
        delete: mock<(storageKey: string, bucket?: 'private' | 'public') => Promise<void>>(() =>
            Promise.resolve(),
        ),
        getUrl: mock<(storageKey: string, bucket?: 'private' | 'public') => Promise<string>>(() =>
            Promise.resolve('https://example.com/file.txt'),
        ),
        upload: mock<
            (input: {
                bucket?: 'private' | 'public';
                buffer: { byteLength: number };
                filename: string;
                mimeType: string;
            }) => Promise<object>
        >(() =>
            Promise.resolve({
                filename: 'test.txt',
                mimeType: 'text/plain',
                size: 11,
                storageKey: 'abc.txt',
            }),
        ),
    },
};
