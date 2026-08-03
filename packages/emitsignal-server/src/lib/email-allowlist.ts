import { environment } from '#/schema/environment';

// Empty/unset list => allowlist disabled, everyone allowed.
export function getAllowedEmails(): string[] {
    return environment.AUTH_ALLOWED_EMAILS.split(',')
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0);
}

export function isEmailAllowed(email: string): boolean {
    const allowed = getAllowedEmails();

    if (allowed.length === 0) {
        return true;
    }

    return allowed.includes(email.trim().toLowerCase());
}
