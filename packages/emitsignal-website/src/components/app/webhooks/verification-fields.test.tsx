import type { VerificationScheme } from '@emitsignal/shared';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { VerificationFields } from './verification-fields';

function renderFields(secret = 'fixture-secret-value', scheme: VerificationScheme = 'github') {
    return render(
        <VerificationFields
            config={{ algorithm: 'sha256', encoding: 'hex', header: '', prefix: '' }}
            hasStoredSecret={false}
            onConfigChange={vi.fn()}
            onSchemeChange={vi.fn()}
            onSecretChange={vi.fn()}
            scheme={scheme}
            secret={secret}
        />,
    );
}

describe('VerificationFields secret reveal', () => {
    test('masks the secret until the reveal button is pressed', () => {
        renderFields();

        const input = screen.getByPlaceholderText('Paste the signing secret');

        expect(input.getAttribute('type')).toBe('password');

        fireEvent.click(screen.getByTitle('Show secret'));

        expect(input.getAttribute('type')).toBe('text');

        fireEvent.click(screen.getByTitle('Hide secret'));

        expect(input.getAttribute('type')).toBe('password');
    });

    test('cannot reveal an empty field', () => {
        renderFields('');

        expect((screen.getByTitle('Show secret') as HTMLButtonElement).disabled).toBe(true);
    });

    test('cannot reveal when verification is off', () => {
        renderFields('', 'none');

        expect((screen.getByTitle('Show secret') as HTMLButtonElement).disabled).toBe(true);
    });
});
