export type ClassValue = false | null | number | string | undefined;

export function cn(...classes: ClassValue[]): string {
    return classes.filter(Boolean).join(' ');
}
