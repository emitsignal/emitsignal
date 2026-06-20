import { afterEach, describe, expect, it } from 'bun:test';

import { environment } from '../schema/environment';
import { getAllowedEmails, isEmailAllowed } from './email-allowlist';

const originalAllowedEmails = environment.AUTH_ALLOWED_EMAILS;

afterEach(() => {
    environment.AUTH_ALLOWED_EMAILS = originalAllowedEmails;
});

describe('email-allowlist', () => {
    it('allows any email when the allowlist is empty', () => {
        environment.AUTH_ALLOWED_EMAILS = '';

        expect(getAllowedEmails()).toEqual([]);
        expect(isEmailAllowed('anyone@example.com')).toBe(true);
    });

    it('allows any email when the allowlist is only whitespace/commas', () => {
        environment.AUTH_ALLOWED_EMAILS = '  ,  , ';

        expect(getAllowedEmails()).toEqual([]);
        expect(isEmailAllowed('anyone@example.com')).toBe(true);
    });

    it('allows listed emails and rejects others', () => {
        environment.AUTH_ALLOWED_EMAILS = 'allowed@example.com,second@example.com';

        expect(isEmailAllowed('allowed@example.com')).toBe(true);
        expect(isEmailAllowed('second@example.com')).toBe(true);
        expect(isEmailAllowed('blocked@example.com')).toBe(false);
    });

    it('matches case-insensitively and trims whitespace on both sides', () => {
        environment.AUTH_ALLOWED_EMAILS = '  Allowed@Example.com ,  Second@Example.com  ';

        expect(getAllowedEmails()).toEqual(['allowed@example.com', 'second@example.com']);
        expect(isEmailAllowed('ALLOWED@example.com')).toBe(true);
        expect(isEmailAllowed('  second@EXAMPLE.com  ')).toBe(true);
        expect(isEmailAllowed('blocked@example.com')).toBe(false);
    });
});
