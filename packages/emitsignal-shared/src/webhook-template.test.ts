import { describe, expect, test } from 'bun:test';

import { applyTemplate, renderTemplate } from './webhook-template.ts';

const payload = {
    heartbeat: {
        monitorID: 42,
        msg: 'Request failed with status code 404',
        status: 0,
    },
    labels: ['a', 'b', 'c'],
    monitor: {
        id: 42,
        name: 'EmitSignal',
        tags: [
            { color: '#059669', id: 2, name: 'Production' },
            { color: '#ff0000', id: 3, name: 'test-tag' },
        ],
    },
};

describe('applyTemplate wildcard iteration', () => {
    test('maps a key over an object array', () => {
        expect(applyTemplate('{{monitor.tags.*.name}}', payload)).toBe('Production, test-tag');
    });

    test('maps a different key over an object array', () => {
        expect(applyTemplate('{{monitor.tags.*.color}}', payload)).toBe('#059669, #ff0000');
    });

    test('joins a scalar array', () => {
        expect(applyTemplate('{{labels.*}}', payload)).toBe('a, b, c');
    });

    test('resolves an explicit index without regression', () => {
        expect(applyTemplate('{{monitor.tags.0.name}}', payload)).toBe('Production');
    });

    test('resolves a scalar path unchanged', () => {
        expect(applyTemplate('{{heartbeat.msg}}', payload)).toBe(
            'Request failed with status code 404',
        );
    });

    test('returns the empty value for a missing path', () => {
        expect(applyTemplate('{{monitor.nope.*.x}}', payload)).toBe('');
    });

    test('honors a custom empty value', () => {
        expect(applyTemplate('{{monitor.nope}}', payload, '—')).toBe('—');
    });

    test('returns the empty value for wildcard on a non-array', () => {
        expect(applyTemplate('{{monitor.name.*.x}}', payload)).toBe('');
    });
});

describe('renderTemplate with wildcard tags', () => {
    test('splits the joined output into individual tags', () => {
        const rendered = renderTemplate(
            { tags: '{{monitor.tags.*.name}}', title: '{{monitor.name}}' },
            payload,
        );
        expect(rendered.tags).toEqual(['Production', 'test-tag']);
        expect(rendered.title).toBe('EmitSignal');
    });
});
