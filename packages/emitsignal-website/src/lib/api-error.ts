export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
    if (!(error instanceof Error)) {
        return fallback;
    }

    const match = error.message.match(/^\d{3}\s+([\s\S]*)$/);

    if (match) {
        try {
            const parsed = JSON.parse(match[1]) as { error?: string; message?: string };

            if (parsed.message) {
                return parsed.message;
            }

            if (parsed.error) {
                return parsed.error;
            }
        } catch {
            // body was not JSON — fall through to the raw message
        }
    }

    return error.message || fallback;
}
