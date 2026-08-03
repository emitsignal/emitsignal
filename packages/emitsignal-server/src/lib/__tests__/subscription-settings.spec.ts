import { describe, expect, it } from 'bun:test';

import {
    DEFAULT_SUBSCRIPTION_SETTINGS,
    parseSubscriptionSettings,
    serializeSubscriptionSettings,
} from '#/utils/subscription-settings';

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

    it('parses a non-empty description override', () => {
        expect(
            parseSubscriptionSettings('{"listenSince":"always","description":"  My alerts  "}'),
        ).toEqual({ description: 'My alerts', listenSince: 'always' });
    });

    it('omits a blank or non-string description', () => {
        expect(parseSubscriptionSettings('{"description":"   "}')).toEqual(
            DEFAULT_SUBSCRIPTION_SETTINGS,
        );
        expect(parseSubscriptionSettings('{"description":123}')).toEqual(
            DEFAULT_SUBSCRIPTION_SETTINGS,
        );
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

    it('persists a trimmed description', () => {
        expect(serializeSubscriptionSettings({ description: '  My alerts  ' })).toBe(
            '{"listenSince":"subscription_date","description":"My alerts"}',
        );
    });

    it('drops a blank description', () => {
        expect(serializeSubscriptionSettings({ description: '   ' })).toBe(
            '{"listenSince":"subscription_date"}',
        );
    });
});
