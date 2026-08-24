import { describe, expect, it } from 'bun:test';

import { applyTemplate, parsePlaceholder, renderTemplate } from './webhook-template.ts';

// The Stripe customer.subscription.created delivery that motivated transforms.
const stripePayload = {
    created: 1787142663,
    data: {
        object: {
            items: {
                data: [{ price: { unit_amount: 500 } }],
            },
            status: 'active',
        },
    },
    type: 'customer.subscription.created',
};

describe('parsePlaceholder', () => {
    it('reads a bare path with no filters', () => {
        expect(parsePlaceholder('data.object.status')).toEqual({
            filters: [],
            path: 'data.object.status',
        });
    });

    it('keeps colons and spaces inside a quoted argument', () => {
        expect(parsePlaceholder("created | date:'YYYY-MM-DD HH:mm'")).toEqual({
            filters: [{ args: ['YYYY-MM-DD HH:mm'], name: 'date' }],
            path: 'created',
        });
    });

    it('keeps a pipe inside a quoted argument', () => {
        expect(parsePlaceholder("status | default:' | '")).toEqual({
            filters: [{ args: [' | '], name: 'default' }],
            path: 'status',
        });
    });

    it('splits multiple arguments on unquoted commas', () => {
        expect(parsePlaceholder("amount | currency:'eur','de-DE'").filters[0]!.args).toEqual([
            'eur',
            'de-DE',
        ]);
    });

    it('keeps a comma inside a quoted argument', () => {
        expect(parsePlaceholder("status | default:'a,b'").filters[0]!.args).toEqual(['a,b']);
    });

    it('chains filters left to right', () => {
        expect(parsePlaceholder('amount | divide:100 | number:2').filters).toEqual([
            { args: ['100'], name: 'divide' },
            { args: ['2'], name: 'number' },
        ]);
    });

    it('treats the remainder of an unterminated quote as one literal argument', () => {
        expect(parsePlaceholder("status | default:'oops | upper").filters).toEqual([
            { args: ["'oops | upper"], name: 'default' },
        ]);
    });
});

describe('date filter', () => {
    it('formats unix seconds with the default pattern', () => {
        expect(applyTemplate('{{created | date}}', stripePayload)).toBe('2026-08-19 12:31');
    });

    it('formats unix milliseconds', () => {
        expect(applyTemplate('{{at | date}}', { at: 1787142663000 })).toBe('2026-08-19 12:31');
    });

    it('formats an ISO string', () => {
        expect(applyTemplate("{{at | date:'DD MMM YYYY'}}", { at: '2026-08-18T08:31:03Z' })).toBe(
            '18 Aug 2026',
        );
    });

    it('supports the iso pattern', () => {
        expect(applyTemplate("{{created | date:'iso'}}", stripePayload)).toBe(
            '2026-08-19T12:31:03.000Z',
        );
    });

    it('passes a non-date value through untouched', () => {
        expect(applyTemplate('{{type | date}}', stripePayload)).toBe(
            'customer.subscription.created',
        );
    });
});

describe('number and currency filters', () => {
    it('converts minor units element-wise across a wildcard', () => {
        expect(
            applyTemplate(
                "{{data.object.items.data.*.price.unit_amount | divide:100 | currency:'usd'}}",
                stripePayload,
            ),
        ).toBe('$5.00');
    });

    it('formats every element before joining them', () => {
        const payload = { items: [{ amount: 500 }, { amount: 2500 }] };

        expect(applyTemplate("{{items.*.amount | divide:100 | currency:'usd'}}", payload)).toBe(
            '$5.00, $25.00',
        );
    });

    it('falls back to a plain code for a malformed currency', () => {
        expect(applyTemplate("{{amount | currency:'zz'}}", { amount: 5 })).toBe('ZZ 5');
    });

    it('ignores a zero divisor', () => {
        expect(applyTemplate('{{amount | divide:0}}', { amount: 500 })).toBe('500');
    });

    it('applies fixed decimals', () => {
        expect(applyTemplate('{{amount | number:2}}', { amount: 5 })).toBe('5.00');
    });

    it('multiplies', () => {
        expect(applyTemplate('{{amount | multiply:100}}', { amount: 5 })).toBe('500');
    });
});

describe('text filters', () => {
    it('uppercases and lowercases', () => {
        expect(applyTemplate('{{status | upper}}', { status: 'active' })).toBe('ACTIVE');
        expect(applyTemplate('{{status | lower}}', { status: 'ACTIVE' })).toBe('active');
    });

    it('title-cases each word', () => {
        expect(applyTemplate('{{name | title}}', { name: 'pulse monthly PLAN' })).toBe(
            'Pulse Monthly Plan',
        );
    });

    it('truncates with an ellipsis', () => {
        expect(applyTemplate('{{type | truncate:8}}', stripePayload)).toBe('customer…');
    });

    it('leaves a short string untruncated', () => {
        expect(applyTemplate('{{status | truncate:80}}', { status: 'active' })).toBe('active');
    });

    it('supplies a per-placeholder default for a missing path', () => {
        expect(applyTemplate("{{nope | default:'unknown'}}", stripePayload)).toBe('unknown');
    });

    it('wins over the template-wide default value', () => {
        expect(
            applyTemplate("{{nope | default:'unknown'}}", stripePayload, { defaultValue: '—' }),
        ).toBe('unknown');
    });
});

describe('map filter', () => {
    const replacements = { active: 'Ativa', 'customer.subscription.created': 'Assinatura criada' };

    it('replaces a matching value', () => {
        expect(applyTemplate('{{type | map}}', stripePayload, { replacements })).toBe(
            'Assinatura criada',
        );
    });

    it('passes an unmapped value through unchanged', () => {
        expect(applyTemplate('{{data.object.status | map}}', stripePayload, {})).toBe('active');
    });

    it('uses an explicit fallback on a miss', () => {
        expect(applyTemplate("{{nope | map:'other'}}", stripePayload, { replacements })).toBe('');
    });

    it('reads the dictionary off the template in renderTemplate', () => {
        const rendered = renderTemplate(
            { replacements, title: '{{type | map}} · {{data.object.status | map}}' },
            stripePayload,
        );

        expect(rendered.title).toBe('Assinatura criada · Ativa');
    });

    it('ignores a replacements value that is not a flat string map', () => {
        const rendered = renderTemplate(
            {
                replacements: { active: 3 } as unknown as Record<string, string>,
                title: '{{data.object.status | map}}',
            },
            stripePayload,
        );

        expect(rendered.title).toBe('active');
    });
});

describe('unknown filters', () => {
    it('passes the value through without throwing', () => {
        expect(applyTemplate('{{data.object.status | nope}}', stripePayload)).toBe('active');
    });

    it('still applies the known filters in the chain', () => {
        expect(applyTemplate('{{data.object.status | nope | upper}}', stripePayload)).toBe(
            'ACTIVE',
        );
    });
});

describe('link label cap', () => {
    it('cannot be bypassed by truncate', () => {
        const rendered = renderTemplate(
            { link: 'https://status.dev', linkLabel: '{{label | truncate:200}}' },
            { label: 'x'.repeat(200) },
        );

        expect(rendered.linkLabel.length).toBe(40);
    });
});
