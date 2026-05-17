import { mock } from 'bun:test';

export const prismaMock = {
    acknowledgment: {
        count: mock<() => Promise<number>>(() => Promise.resolve(0)),
        upsert: mock<() => Promise<object>>(() => Promise.resolve({ id: 'ack-1' })),
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
        findMany: mock<() => Promise<object[]>>(() => Promise.resolve([])),
        findUnique: mock<() => Promise<null | object>>(() => Promise.resolve(null)),
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
        create: mock<() => Promise<object>>(() =>
            Promise.resolve({
                createdAt: new Date(),
                description: '',
                displayName: 'test',
                id: 'topic-1',
                isPublic: true,
                name: 'test',
            }),
        ),
        findMany: mock<() => Promise<object[]>>(() => Promise.resolve([])),
        findUnique: mock<() => Promise<null | object>>(() => Promise.resolve(null)),
        upsert: mock<() => Promise<object>>(() =>
            Promise.resolve({
                createdAt: new Date(),
                id: 'topic-1',
                name: 'test',
            }),
        ),
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
};
