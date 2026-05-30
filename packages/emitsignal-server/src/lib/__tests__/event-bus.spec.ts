import { describe, expect, it, mock } from 'bun:test';

import { bus, type MessageEvent } from '../event-bus';

describe('EmitSignalBus', () => {
    it('delivers published events to subscribers of the same topic', () => {
        const handler = mock();
        bus.subscribe('test-topic', handler);

        const event: MessageEvent = {
            acknowledgmentCount: 0,
            actions: [],
            attachments: [],
            body: 'Test body',
            createdAt: Date.now(),
            id: 'msg-1',
            priority: 3,
            tags: [],
            title: 'Test',
            topicId: 'topic-1',
            topicName: 'test-topic',
        };

        bus.publish('test-topic', event);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(event);

        bus.removeAllListeners();
    });

    it('does NOT deliver events to subscribers of other topics', () => {
        const handlerA = mock();
        const handlerB = mock();

        bus.subscribe('topic-a', handlerA);
        bus.subscribe('topic-b', handlerB);

        bus.publish('topic-a', {
            acknowledgmentCount: 0,
            actions: [],
            attachments: [],
            body: 'A',
            createdAt: Date.now(),
            id: '1',
            priority: 1,
            tags: [],
            title: 'A',
            topicId: 't1',
            topicName: 'topic-a',
        });

        expect(handlerA).toHaveBeenCalledTimes(1);
        expect(handlerB).toHaveBeenCalledTimes(0);

        bus.removeAllListeners();
    });

    it('wildcard (*) receives events from all topics', () => {
        const handler = mock();

        bus.subscribe('*', handler);

        bus.publish('topic-x', {
            acknowledgmentCount: 0,
            actions: [],
            attachments: [],
            body: 'X',
            createdAt: Date.now(),
            id: '1',
            priority: 1,
            tags: [],
            title: 'X',
            topicId: 't1',
            topicName: 'topic-x',
        });

        bus.publish('topic-y', {
            acknowledgmentCount: 0,
            actions: [],
            attachments: [],
            body: 'Y',
            createdAt: Date.now(),
            id: '2',
            priority: 1,
            tags: [],
            title: 'Y',
            topicId: 't2',
            topicName: 'topic-y',
        });

        expect(handler).toHaveBeenCalledTimes(2);

        bus.removeAllListeners();
    });

    it('multiple subscribers to the same topic all receive the event', () => {
        const handler1 = mock();
        const handler2 = mock();

        bus.subscribe('shared', handler1);
        bus.subscribe('shared', handler2);

        bus.publish('shared', {
            acknowledgmentCount: 0,
            actions: [],
            attachments: [],
            body: '',
            createdAt: Date.now(),
            id: '1',
            priority: 1,
            tags: [],
            title: '',
            topicId: 't1',
            topicName: 'shared',
        });

        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledTimes(1);

        bus.removeAllListeners();
    });

    it('unsubscribe() stops future events', () => {
        const handler = mock();
        const unsubscribe = bus.subscribe('topic', handler);

        bus.publish('topic', {
            acknowledgmentCount: 0,
            actions: [],
            attachments: [],
            body: '',
            createdAt: Date.now(),
            id: '1',
            priority: 1,
            tags: [],
            title: '',
            topicId: 't1',
            topicName: 'topic',
        });

        expect(handler).toHaveBeenCalledTimes(1);

        unsubscribe();

        bus.publish('topic', {
            acknowledgmentCount: 0,
            actions: [],
            attachments: [],
            body: '',
            createdAt: Date.now(),
            id: '2',
            priority: 1,
            tags: [],
            title: '',
            topicId: 't1',
            topicName: 'topic',
        });

        expect(handler).toHaveBeenCalledTimes(1);

        bus.removeAllListeners();
    });

    it('unsubscribe() is idempotent', () => {
        const handler = mock();
        const unsubscribe = bus.subscribe('topic', handler);

        unsubscribe();
        expect(() => unsubscribe()).not.toThrow();

        bus.removeAllListeners();
    });

    it('publish with no subscribers does not throw', () => {
        expect(() =>
            bus.publish('no-listeners', {
                acknowledgmentCount: 0,
                actions: [],
                attachments: [],
                body: '',
                createdAt: Date.now(),
                id: '1',
                priority: 1,
                tags: [],
                title: '',
                topicId: 't1',
                topicName: 'no-listeners',
            }),
        ).not.toThrow();
    });

    it('event data integrity is preserved', () => {
        const handler = mock();

        bus.subscribe('data-test', handler);

        const event: MessageEvent = {
            acknowledgmentCount: 42,
            actions: [{ label: 'Ack', type: 'acknowledge' }],
            attachments: [],
            body: 'Body with unicode: café 🎉',
            createdAt: 1700000000000,
            id: 'msg-custom-1',
            priority: 5,
            tags: ['urgent', 'finance'],
            title: 'Complex Event',
            topicId: 'topic-custom',
            topicName: 'data-test',
        };

        bus.publish('data-test', event);

        expect(handler).toHaveBeenCalledWith(event);
        const received = handler.mock.calls[0][0] as MessageEvent;
        expect(received.acknowledgmentCount).toBe(42);
        expect(received.actions).toEqual([{ label: 'Ack', type: 'acknowledge' }]);
        expect(received.body).toBe('Body with unicode: café 🎉');
        expect(received.createdAt).toBe(1700000000000);
        expect(received.tags).toEqual(['urgent', 'finance']);
        expect(received.priority).toBe(5);

        bus.removeAllListeners();
    });
});
