import { describe, expect, it } from 'bun:test';

import { validateActions } from '../actions';

describe('validateActions', () => {
    describe('empty / non-array input', () => {
        it('returns empty actions for an empty array', () => {
            const result = validateActions([]);

            expect(result).toEqual({ actions: [], ok: true });
        });

        it('returns empty actions for undefined', () => {
            const result = validateActions(undefined);

            expect(result).toEqual({ actions: [], ok: true });
        });

        it('returns empty actions for null', () => {
            const result = validateActions(null);

            expect(result).toEqual({ actions: [], ok: true });
        });

        it('returns empty actions for a non-array value', () => {
            const result = validateActions('not-an-array');

            expect(result).toEqual({ actions: [], ok: true });
        });
    });

    describe('valid actions', () => {
        it('accepts a single acknowledge action', () => {
            const result = validateActions([{ type: 'acknowledge' }]);

            expect(result).toEqual({
                actions: [{ label: 'Acknowledge', type: 'acknowledge' }],
                ok: true,
            });
        });

        it('accepts a single view action with url', () => {
            const result = validateActions([{ type: 'view', url: 'https://example.com' }]);

            expect(result).toEqual({
                actions: [{ label: 'View', type: 'view', url: 'https://example.com' }],
                ok: true,
            });
        });

        it('accepts acknowledge + view together', () => {
            const result = validateActions([
                { label: 'Got it', type: 'acknowledge' },
                { label: 'Read more', type: 'view', url: 'https://example.com' },
            ]);

            expect(result).toEqual({
                actions: [
                    { label: 'Got it', type: 'acknowledge' },
                    { label: 'Read more', type: 'view', url: 'https://example.com' },
                ],
                ok: true,
            });
        });

        it('sets default label for acknowledge', () => {
            const result = validateActions([{ type: 'acknowledge' }]);

            expect(result).toHaveProperty('actions.0.label', 'Acknowledge');
        });

        it('sets default label for view', () => {
            const result = validateActions([{ type: 'view', url: 'https://example.com' }]);

            expect(result).toHaveProperty('actions.0.label', 'View');
        });
    });

    describe('validation errors', () => {
        it('rejects more than 2 actions', () => {
            const result = validateActions([
                { type: 'acknowledge' },
                { type: 'view', url: 'https://a.com' },
                { type: 'view', url: 'https://b.com' },
            ]);

            expect(result).toEqual({ error: 'actions: max 2 allowed' });
        });

        it('rejects duplicate acknowledge actions', () => {
            const result = validateActions([{ type: 'acknowledge' }, { type: 'acknowledge' }]);

            expect(result).toEqual({ error: 'actions: only one acknowledge action allowed' });
        });

        it('rejects view action without url', () => {
            const result = validateActions([{ type: 'view' }]);

            expect(result).toEqual({ error: 'actions: view action requires a url' });
        });

        it('rejects view action with empty url', () => {
            const result = validateActions([{ type: 'view', url: '' }]);

            expect(result).toEqual({ error: 'actions: view action requires a url' });
        });

        it('rejects duplicate view urls', () => {
            const result = validateActions([
                { type: 'view', url: 'https://example.com' },
                { type: 'view', url: 'https://example.com' },
            ]);

            expect(result).toEqual({ error: 'actions: duplicate view url not allowed' });
        });

        it('rejects unknown action type', () => {
            const result = validateActions([{ type: 'invalid' }]);

            expect(result).toEqual({ error: 'actions: unknown type "invalid"' });
        });

        it('rejects non-object action items', () => {
            const result = validateActions(['not-an-object']);

            expect(result).toEqual({ error: 'actions: each action must be an object' });
        });
    });
});
