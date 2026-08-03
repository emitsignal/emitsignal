// Parses a comma-separated `?tags=` value, trimming blanks and dropping duplicates.
export function parseTagsQueryParam(raw: string | undefined): string[] {
    if (!raw) {
        return [];
    }

    return Array.from(
        new Set(
            raw
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
        ),
    );
}
