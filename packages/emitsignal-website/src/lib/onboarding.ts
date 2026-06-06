const KEY = '@emitsignal/onboarding_complete';

export function isOnboardingComplete(): boolean {
    if (typeof window === 'undefined') {
        return true;
    }

    return localStorage.getItem(KEY) === 'true';
}

export function markOnboardingComplete(): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(KEY, 'true');
    }
}
