export const TOKEN_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function isRandomToken(
    value: string,
    length: number,
    alphabet: string = TOKEN_ALPHABET,
): boolean {
    return value.length === length && [...value].every((char) => alphabet.includes(char));
}

export function randomToken(length: number, alphabet: string = TOKEN_ALPHABET): string {
    // Bytes above the last whole multiple of the alphabet are discarded rather
    // than folded with `%`, which would make the first few characters likelier.
    const ceiling = Math.floor(256 / alphabet.length) * alphabet.length;
    let token = '';

    while (token.length < length) {
        const bytes = new Uint8Array(length - token.length);

        crypto.getRandomValues(bytes);

        for (const byte of bytes) {
            if (byte < ceiling) {
                token += alphabet[byte % alphabet.length];
            }
        }
    }

    return token;
}
