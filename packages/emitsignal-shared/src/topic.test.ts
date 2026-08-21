import { describe, expect, test } from 'bun:test';

import { publishUrl } from './topic.ts';

describe('publishUrl', () => {
    test('appends the publish path to the base URL', () => {
        expect(publishUrl('https://api.emitsignal.com', 'alerts')).toBe(
            'https://api.emitsignal.com/publish/alerts',
        );
    });

    test('formats the apex alias the same way', () => {
        expect(publishUrl('https://emitsignal.com', 'alerts')).toBe(
            'https://emitsignal.com/publish/alerts',
        );
    });

    test('keeps the separator in a nested topic literal', () => {
        expect(publishUrl('https://emitsignal.com', 'alerts/prod')).toBe(
            'https://emitsignal.com/publish/alerts/prod',
        );
    });

    test('strips a trailing slash from the base URL', () => {
        expect(publishUrl('https://emitsignal.com/', 'alerts')).toBe(
            'https://emitsignal.com/publish/alerts',
        );
    });

    test('supports a base URL with a port', () => {
        expect(publishUrl('http://localhost:5001', 'deploy/prod')).toBe(
            'http://localhost:5001/publish/deploy/prod',
        );
    });
});
