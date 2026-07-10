import { describe, expect, it } from 'bun:test';

import { duration } from '../duration';
import {
    ANON_RETENTION_DAYS,
    ATTACHMENT_MAX_RETENTION_DAYS,
    attachmentExpiresAt,
    messageExpiresAt,
    messageRetentionDays,
} from './retention';

describe('messageRetentionDays', () => {
    it('maps each plan to its retention window', () => {
        expect(messageRetentionDays('beam')).toBe(0); // forever
        expect(messageRetentionDays('free')).toBe(90);
        expect(messageRetentionDays('pulse')).toBe(365);
    });

    it('uses the anonymous window when there is no plan', () => {
        expect(ANON_RETENTION_DAYS).toBe(7);
        expect(messageRetentionDays(null)).toBe(ANON_RETENTION_DAYS);
    });
});

describe('messageExpiresAt', () => {
    const deliveredAt = new Date('2026-01-01T00:00:00.000Z');

    it('returns null for a 0 (forever) retention', () => {
        expect(messageExpiresAt(deliveredAt, 0)).toBeNull();
    });

    it('adds the retention window to the delivery time', () => {
        const expiresAt = messageExpiresAt(deliveredAt, 7);

        expect(expiresAt).not.toBeNull();
        expect((expiresAt as Date).getTime() - deliveredAt.getTime()).toBe(
            duration.days(7).as('ms'),
        );
    });
});

describe('attachmentExpiresAt', () => {
    const deliveredAt = new Date('2026-01-01T00:00:00.000Z');

    it('caps a long plan window at the attachment maximum', () => {
        const expiresAt = attachmentExpiresAt(deliveredAt, 90);

        expect(expiresAt.getTime() - deliveredAt.getTime()).toBe(
            duration.days(ATTACHMENT_MAX_RETENTION_DAYS).as('ms'),
        );
    });

    it('uses the plan window when it is below the cap', () => {
        const expiresAt = attachmentExpiresAt(deliveredAt, 7);

        expect(expiresAt.getTime() - deliveredAt.getTime()).toBe(duration.days(7).as('ms'));
    });

    it('still expires (at the cap) for a forever plan', () => {
        const expiresAt = attachmentExpiresAt(deliveredAt, 0);

        expect(expiresAt.getTime() - deliveredAt.getTime()).toBe(
            duration.days(ATTACHMENT_MAX_RETENTION_DAYS).as('ms'),
        );
    });
});
