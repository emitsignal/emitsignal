export interface TestAction {
    label?: string;
    type: 'acknowledge' | 'view';
    url?: string;
}

export interface TestAttachment {
    filename: string;
    mimeType: string;
    size: number;
    storageKey: string;
    url: string;
}

export interface TestMessage {
    acknowledgmentCount: number;
    actions: TestAction[];
    attachments: TestAttachment[];
    body: string;
    createdAt: number;
    id: string;
    priority: 1 | 2 | 3 | 4 | 5;
    tags: string[];
    title: string;
    topicId: string;
    topicName?: string;
}

export interface TestSession {
    token: string;
    user: TestUser;
}

export interface TestSubscription {
    createdAt: number;
    id: string;
    pushEnabled: boolean;
    topic: TestTopic;
}

export interface TestTopic {
    createdAt: number;
    description: null | string;
    displayName: string;
    id: string;
    isPublic: boolean;
    name: string;
}

export interface TestTopicSuggestion {
    description: null | string;
    displayName: string;
    name: string;
}

export interface TestTopicWithCounts extends TestTopic {
    messageCount: number;
    subscriberCount: number;
}

export interface TestUser {
    email: string;
    id: string;
    name: null | string;
}
