import { describe, expect, test } from 'bun:test';

import {
    applyTemplate,
    MAX_LINK_LABEL_LENGTH,
    normalizeLinkLabel,
    renderTemplate,
} from './webhook-template.ts';

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
        expect(applyTemplate('{{monitor.nope}}', payload, { defaultValue: '—' })).toBe('—');
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

describe('renderTemplate link', () => {
    test('resolves a link template against the payload', () => {
        const rendered = renderTemplate({ link: 'https://status.dev/{{monitor.id}}' }, payload);
        expect(rendered.link).toBe('https://status.dev/42');
    });

    test('returns an empty link when the template has none', () => {
        expect(renderTemplate({ title: '{{monitor.name}}' }, payload).link).toBe('');
    });

    test('returns an empty link when the template path does not resolve', () => {
        expect(renderTemplate({ link: '{{monitor.nope}}' }, payload).link).toBe('');
    });

    test('trims surrounding whitespace', () => {
        expect(renderTemplate({ link: '  https://status.dev  ' }, payload).link).toBe(
            'https://status.dev',
        );
    });
});

describe('renderTemplate linkLabel', () => {
    test('resolves a label template against the payload', () => {
        const rendered = renderTemplate(
            { link: 'https://status.dev', linkLabel: 'Open {{monitor.name}}' },
            payload,
        );
        expect(rendered.linkLabel).toBe('Open EmitSignal');
    });

    test('returns an empty label when the template has none', () => {
        expect(renderTemplate({ link: 'https://status.dev' }, payload).linkLabel).toBe('');
    });

    test('returns an empty label when the template path does not resolve', () => {
        expect(
            renderTemplate({ link: 'https://status.dev', linkLabel: '{{monitor.nope}}' }, payload)
                .linkLabel,
        ).toBe('');
    });

    test('ignores the label when there is no link to attach it to', () => {
        expect(renderTemplate({ linkLabel: 'Open dashboard' }, payload).linkLabel).toBe('');
    });

    test('collapses whitespace injected by the payload', () => {
        expect(
            renderTemplate(
                { link: 'https://status.dev', linkLabel: '  Open\n\t{{monitor.name}}  ' },
                payload,
            ).linkLabel,
        ).toBe('Open EmitSignal');
    });

    test('caps an over-long label at MAX_LINK_LABEL_LENGTH', () => {
        const rendered = renderTemplate(
            { link: 'https://status.dev', linkLabel: 'x'.repeat(200) },
            payload,
        );
        expect(rendered.linkLabel).toBe('x'.repeat(MAX_LINK_LABEL_LENGTH));
    });
});

describe('normalizeLinkLabel', () => {
    test('returns an empty string for whitespace-only input', () => {
        expect(normalizeLinkLabel('   \n  ')).toBe('');
    });

    test('does not leave a trailing space when the cap lands mid-word', () => {
        expect(normalizeLinkLabel(`${'x'.repeat(MAX_LINK_LABEL_LENGTH - 1)} tail`)).toBe(
            'x'.repeat(MAX_LINK_LABEL_LENGTH - 1),
        );
    });
});
