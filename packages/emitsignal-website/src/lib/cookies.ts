const ONE_YEAR_SECONDS = 31536000;

export function setPreferenceCookie(name: string, value: string): void {
    const secure = window.location.protocol === 'https:' ? '; secure' : '';

    document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax${secure}`;
}
