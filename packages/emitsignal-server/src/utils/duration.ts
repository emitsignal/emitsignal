const UNITS = {
    days: 86_400_000,
    hours: 3_600_000,
    minutes: 60_000,
    ms: 1,
    seconds: 1_000,
    years: 31_536_000_000,
} as const;

type Unit = keyof typeof UNITS;

const createDuration = (value: number, unitMs: number) => {
    const ms = value * unitMs;

    return {
        as(unit: Unit): number {
            return ms / UNITS[unit];
        },
    };
};

export const duration = {
    days: (n: number) => createDuration(n, UNITS.days),
    hours: (n: number) => createDuration(n, UNITS.hours),
    minutes: (n: number) => createDuration(n, UNITS.minutes),
    seconds: (n: number) => createDuration(n, UNITS.seconds),
    years: (n: number) => createDuration(n, UNITS.years),
};
