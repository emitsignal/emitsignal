import { describe, expect, it } from 'bun:test';

import {
    DEFAULT_SUBSCRIPTION_SETTINGS,
    parseSubscriptionSettings,
    serializeSubscriptionSettings,
} from '../subscription-settings';

describe('parseSubscriptionSettings', () => {
    it('returns defaults for an empty object', () => {
        expect(parseSubscriptionSettings('{}')).toEqual(DEFAULT_SUBSCRIPTION_SETTINGS);
    });

    it('parses a valid listenSince value', () => {
        expect(parseSubscriptionSettings('{"listenSince":"always"}')).toEqual({
            listenSince: 'always',
        });
    });

    it('falls back to defaults for malformed JSON', () => {
        expect(parseSubscriptionSettings('not json')).toEqual(DEFAULT_SUBSCRIPTION_SETTINGS);
    });

    it('falls back to defaults for an invalid listenSince value', () => {
        expect(parseSubscriptionSettings('{"listenSince":"yesterday"}')).toEqual(
            DEFAULT_SUBSCRIPTION_SETTINGS,
        );
    });

    it('ignores non-object JSON', () => {
        expect(parseSubscriptionSettings('null')).toEqual(DEFAULT_SUBSCRIPTION_SETTINGS);
        expect(parseSubscriptionSettings('42')).toEqual(DEFAULT_SUBSCRIPTION_SETTINGS);
    });
});

describe('serializeSubscriptionSettings', () => {
    it('fills defaults for missing keys', () => {
        expect(serializeSubscriptionSettings({})).toBe('{"listenSince":"subscription_date"}');
    });

    it('serializes a provided value', () => {
        expect(serializeSubscriptionSettings({ listenSince: 'always' })).toBe(
            '{"listenSince":"always"}',
        );
    });

    it('falls back to defaults for an invalid value', () => {
        expect(
            serializeSubscriptionSettings({
                listenSince: 'whenever' as never,
            }),
        ).toBe('{"listenSince":"subscription_date"}');
    });
});
