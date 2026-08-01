const ONE_YEAR_SECONDS = 31536000;

export function setPreferenceCookie(name: string, value: string): void {
    // Read the protocol off `document`, not `window`: callers guard on
    // `typeof document !== 'undefined'`, so anything else escapes that check.
    const secure = document.location.protocol === 'https:' ? '; secure' : '';

    document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax${secure}`;
}
