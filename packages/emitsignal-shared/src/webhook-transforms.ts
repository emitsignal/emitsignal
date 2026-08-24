import { relativeTime } from './format.ts';

export interface TemplateFilter {
    args: string[];
    name: string;
}

export interface TransformContext {
    replacements?: Record<string, string>;
}

export type TransformFunction = (
    value: unknown,
    args: string[],
    context: TransformContext,
) => unknown;

const DEFAULT_DATE_PATTERN = 'YYYY-MM-DD HH:mm';
const DEFAULT_LOCALE = 'en-US';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// A timestamp below this is far more plausibly seconds than milliseconds:
// 1e11 ms is 1973, while 1e11 s is the year 5138.
const SECONDS_UPPER_BOUND = 1e11;

export const TRANSFORMS: Record<string, TransformFunction> = {
    currency: (value, args) => {
        const number = toNumber(value);

        if (number === null) {
            return value;
        }

        const code = (args[0] ?? 'usd').toUpperCase();
        const locale = args[1] ?? DEFAULT_LOCALE;

        try {
            return new Intl.NumberFormat(locale, { currency: code, style: 'currency' }).format(
                number,
            );
        } catch {
            return `${code} ${number}`;
        }
    },

    date: (value, args) => {
        const date = toDate(value);

        if (date === null) {
            return value;
        }

        const pattern = args[0] ?? DEFAULT_DATE_PATTERN;

        if (pattern === 'iso') {
            return date.toISOString();
        }

        if (pattern === 'relative') {
            return relativeTime(date.getTime());
        }

        return formatDate(date, pattern);
    },

    default: (value, args) => {
        const fallback = args[0] ?? '';

        if (value == null || value === '') {
            return fallback;
        }

        return value;
    },

    divide: (value, args) => {
        const number = toNumber(value);
        const divisor = toNumber(args[0]);

        if (number === null || divisor === null || divisor === 0) {
            return value;
        }

        return number / divisor;
    },

    lower: (value) => (typeof value === 'string' ? value.toLowerCase() : value),

    map: (value, args, context) => {
        if (value == null) {
            return value;
        }

        const replacement = context.replacements?.[String(value)];

        if (replacement !== undefined) {
            return replacement;
        }

        return args[0] ?? value;
    },

    multiply: (value, args) => {
        const number = toNumber(value);
        const factor = toNumber(args[0]);

        if (number === null || factor === null) {
            return value;
        }

        return number * factor;
    },

    number: (value, args) => {
        const number = toNumber(value);

        if (number === null) {
            return value;
        }

        const digits = toNumber(args[0]);

        if (digits === null) {
            return new Intl.NumberFormat(DEFAULT_LOCALE).format(number);
        }

        return new Intl.NumberFormat(DEFAULT_LOCALE, {
            maximumFractionDigits: clampDigits(digits),
            minimumFractionDigits: clampDigits(digits),
        }).format(number);
    },

    title: (value) =>
        typeof value === 'string'
            ? value.replace(
                  /\S+/g,
                  (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              )
            : value,

    trim: (value) => (typeof value === 'string' ? value.trim() : value),

    truncate: (value, args) => {
        if (typeof value !== 'string') {
            return value;
        }

        const limit = toNumber(args[0]);

        if (limit === null || limit < 1 || value.length <= limit) {
            return value;
        }

        return `${value.slice(0, limit)}…`;
    },

    upper: (value) => (typeof value === 'string' ? value.toUpperCase() : value),
};

export const TRANSFORM_NAMES = Object.keys(TRANSFORMS);

// Wildcard paths resolve to arrays, so every filter maps over elements rather than
// over the joined string — `items.*.amount | divide:100` must divide each amount.
export function applyFilters(
    value: unknown,
    filters: TemplateFilter[],
    context: TransformContext,
): unknown {
    return filters.reduce((current, filter) => applyFilter(current, filter, context), value);
}

export function isKnownTransform(name: string): boolean {
    return name in TRANSFORMS;
}

function applyFilter(value: unknown, filter: TemplateFilter, context: TransformContext): unknown {
    const transform = TRANSFORMS[filter.name];

    // An unknown filter passes through: a typo must never fail a live delivery.
    if (!transform) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => applyFilter(item, filter, context));
    }

    return transform(value, filter.args, context);
}

function clampDigits(digits: number): number {
    return Math.min(20, Math.max(0, Math.trunc(digits)));
}

function formatDate(date: Date, pattern: string): string {
    const tokens: Record<string, string> = {
        DD: pad(date.getUTCDate()),
        HH: pad(date.getUTCHours()),
        MM: pad(date.getUTCMonth() + 1),
        mm: pad(date.getUTCMinutes()),
        MMM: MONTHS[date.getUTCMonth()]!,
        ss: pad(date.getUTCSeconds()),
        YYYY: String(date.getUTCFullYear()),
    };

    return pattern.replace(/YYYY|MMM|MM|DD|HH|mm|ss/g, (token) => tokens[token] ?? token);
}

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

function toDate(value: unknown): Date | null {
    const number = toNumber(value);

    if (number !== null) {
        const milliseconds = Math.abs(number) < SECONDS_UPPER_BOUND ? number * 1000 : number;
        const fromNumber = new Date(milliseconds);

        return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toNumber(value: unknown): null | number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
}
