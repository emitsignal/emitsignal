import type { PushToken } from '@emitsignal/shared/api';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DeviceRow } from './device-row';

const SECRET_TOKEN = 'ExponentPushToken[secret-value]';

function makeToken(overrides: Partial<PushToken> = {}): PushToken {
    return {
        appId: 'com.emitsignal.preview',
        createdAt: new Date().toISOString(),
        deviceId: 'device-abc123',
        deviceName: 'iPhone 15 Pro',
        id: 'pt-1',
        platform: 'ios',
        pushEnabled: true,
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

function renderRow(token: PushToken, onToggle = vi.fn(), onRemove = vi.fn()) {
    const result = render(<DeviceRow onRemove={onRemove} onToggle={onToggle} token={token} />);

    return { onRemove, onToggle, ...result };
}

describe('DeviceRow', () => {
    test('never renders the push token', () => {
        // The token is not even part of the props, so the only way it could leak
        // is a future change widening PushToken — this guards that.
        const { container } = renderRow(
            makeToken({ ...({ token: SECRET_TOKEN } as Partial<PushToken>) }),
        );

        expect(container.textContent).not.toContain(SECRET_TOKEN);
        expect(container.textContent).not.toContain('ExponentPushToken');
    });

    test('falls back to platform and a deviceId suffix when unnamed', () => {
        renderRow(makeToken({ deviceName: null, platform: 'android' }));

        expect(screen.getByText('Android · …abc123')).toBeTruthy();
    });

    test('toggling reports the inverted flag', () => {
        const { onToggle } = renderRow(makeToken({ pushEnabled: true }));

        fireEvent.click(screen.getByRole('switch'));

        expect(onToggle).toHaveBeenCalledWith('pt-1', false);
    });

    test('removal requires a second confirming click', () => {
        const { onRemove } = renderRow(makeToken());

        fireEvent.click(screen.getByText('Remove'));
        expect(onRemove).not.toHaveBeenCalled();

        fireEvent.click(screen.getByText('Yes, remove'));
        expect(onRemove).toHaveBeenCalledWith('pt-1');
    });

    test('cancelling leaves the device in place', () => {
        const { onRemove } = renderRow(makeToken());

        fireEvent.click(screen.getByText('Remove'));
        fireEvent.click(screen.getByText('Cancel'));

        expect(onRemove).not.toHaveBeenCalled();
        expect(screen.getByRole('switch')).toBeTruthy();
    });
});
