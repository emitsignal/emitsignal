#!/usr/bin/env bun
// Exercises POST /topic/:name against a running EmitSignal server.
//
//   bun scripts/publish.ts --list
//   bun scripts/publish.ts --topic my-topic
//   bun scripts/publish.ts --group errors
//   bun scripts/publish.ts --only action-view,header-basic --dry-run
//
// See scripts/README.md for the full option list.

import type { Outcome, Scenario, ScenarioGroup, ScenarioRequest } from './publish-scenarios.ts';

import { scenarios } from './publish-scenarios.ts';

interface RunnerOptions {
    baseUrl: string;
    delayMilliseconds: number;
    dryRun: boolean;
    groups: string[];
    names: string[];
    retryOnRateLimit: boolean;
    token: string;
    topic: string;
}

interface ScenarioResult {
    actual: 'unknown' | Outcome;
    detail: string;
    passed: boolean;
    scenario: Scenario;
    status: number;
}

const ANONYMOUS_RATE_LIMIT_PER_MINUTE = 10;
const AUTHENTICATED_RATE_LIMIT_PER_MINUTE = 60;
const MAX_RETRY_WAIT_SECONDS = 90;

const color = {
    bold: (value: string) => `[1m${value}[0m`,
    dim: (value: string) => `[2m${value}[0m`,
    green: (value: string) => `[32m${value}[0m`,
    red: (value: string) => `[31m${value}[0m`,
    violet: (value: string) => `[35m${value}[0m`,
    yellow: (value: string) => `[33m${value}[0m`,
};

await main();

function authHeaders(token: string): Record<string, string> {
    if (!token) {
        return {};
    }

    // The server resolves both Bearer session tokens and es_ API keys from the
    // Authorization header; x-api-key is the documented secondary header.
    const headers: Record<string, string> = { authorization: `Bearer ${token}` };

    if (token.startsWith('es_')) {
        headers['x-api-key'] = token;
    }

    return headers;
}

// Publish failures come back two ways: a real 4xx, or HTTP 200 carrying an
// `error` field. Both count as the `error` outcome.
function classify(status: number, payload: unknown): 'unknown' | Outcome {
    if (status >= 400) {
        return 'error';
    }

    if (isRecord(payload)) {
        if ('error' in payload) {
            return 'error';
        }

        if (payload.message === 'scheduled') {
            return 'scheduled';
        }

        if (payload.message === 'posted') {
            return 'posted';
        }
    }

    return 'unknown';
}

function describePayload(status: number, payload: unknown): string {
    if (isRecord(payload)) {
        if (typeof payload.messageId === 'string') {
            const scheduledAt =
                typeof payload.scheduledAt === 'number'
                    ? ` at ${new Date(payload.scheduledAt * 1000).toISOString()}`
                    : '';

            return `${payload.messageId}${scheduledAt}`;
        }

        if (typeof payload.error === 'string') {
            const message = typeof payload.message === 'string' ? `: ${payload.message}` : '';

            return `${payload.error}${message}`;
        }

        if (payload.type === 'validation') {
            return typeof payload.summary === 'string' ? payload.summary : 'validation failed';
        }
    }

    return typeof payload === 'string' ? payload.slice(0, 120) : `HTTP ${status}`;
}

function groupNames(): string[] {
    return [...new Set(scenarios.map((scenario) => scenario.group))].sort();
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

async function main(): Promise<void> {
    const argv = process.argv.slice(2);

    if (argv.includes('--help') || argv.includes('-h')) {
        printHelp();

        return;
    }

    const options = parseArguments(argv);
    const selected = selectScenarios(options);

    if (argv.includes('--list')) {
        printList(selected);

        return;
    }

    if (selected.length === 0) {
        console.error(color.red('no scenarios matched the given --group/--only filters'));

        process.exit(1);
    }

    console.log(
        `${color.bold('EmitSignal publish suite')} ${color.dim(
            `· ${selected.length} scenario(s) · ${options.baseUrl} · topic ${options.topic}`,
        )}`,
    );
    console.log(
        color.dim(
            options.token
                ? `authenticated · limit ${AUTHENTICATED_RATE_LIMIT_PER_MINUTE} publishes/min`
                : `anonymous · limit ${ANONYMOUS_RATE_LIMIT_PER_MINUTE} publishes/min — pass --token for a faster run`,
        ),
    );
    console.log('');

    const results: ScenarioResult[] = [];
    const context = { now: Math.floor(Date.now() / 1000), topic: options.topic };

    for (const [index, scenario] of selected.entries()) {
        const request = scenario.build({ ...context, now: Math.floor(Date.now() / 1000) });

        if (options.dryRun) {
            console.log(`${color.violet(scenario.name)} ${color.dim(scenario.description)}`);
            console.log(`${toCurl(options, request)}\n`);

            continue;
        }

        const result = await runScenario(options, scenario, request);

        results.push(result);
        printResult(result);

        const isLast = index === selected.length - 1;

        if (!isLast && options.delayMilliseconds > 0) {
            await sleep(options.delayMilliseconds);
        }
    }

    if (options.dryRun) {
        return;
    }

    printSummary(results);
}

function parseArguments(argv: string[]): RunnerOptions {
    const options: RunnerOptions = {
        baseUrl: (process.env.EMITSIGNAL_API_URL ?? 'http://localhost:5001').replace(/\/+$/, ''),
        delayMilliseconds: Number(process.env.EMITSIGNAL_DELAY_MS ?? '0'),
        dryRun: false,
        groups: [],
        names: [],
        retryOnRateLimit: true,
        token: process.env.EMITSIGNAL_TOKEN ?? '',
        topic: process.env.EMITSIGNAL_TOPIC ?? 'publish-playground',
    };

    let delayWasSet = options.delayMilliseconds > 0;

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        const next = (): string => {
            const value = argv[index + 1];

            if (value === undefined) {
                console.error(color.red(`missing value for ${argument}`));

                process.exit(1);
            }

            index += 1;

            return value;
        };

        switch (argument) {
            case '--delay':
                options.delayMilliseconds = Number(next());
                delayWasSet = true;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--group':
                options.groups.push(...splitList(next()));
                break;
            case '--list':
                break;
            case '--no-retry':
                options.retryOnRateLimit = false;
                break;
            case '--only':
                options.names.push(...splitList(next()));
                break;
            case '--token':
                options.token = next();
                break;
            case '--topic':
                options.topic = next();
                break;
            case '--url':
                options.baseUrl = next().replace(/\/+$/, '');
                break;
            default:
                console.error(color.red(`unknown option: ${argument}`));

                process.exit(1);
        }
    }

    if (!delayWasSet) {
        // Stay just under the server-side publish limiter so a full run does
        // not spend most of its time waiting out 429s.
        const perMinute = options.token
            ? AUTHENTICATED_RATE_LIMIT_PER_MINUTE
            : ANONYMOUS_RATE_LIMIT_PER_MINUTE;

        options.delayMilliseconds = Math.ceil(60_000 / perMinute) + 100;
    }

    return options;
}

function printHelp(): void {
    console.log(`${color.bold('bun scripts/publish.ts')} — exercise POST /topic/:name

Options
  --url <base>      API base URL              (env EMITSIGNAL_API_URL, default http://localhost:5001)
  --topic <name>    Topic to publish to       (env EMITSIGNAL_TOPIC, default publish-playground)
  --token <token>   Session token or es_ API key (env EMITSIGNAL_TOKEN)
  --group <names>   Comma-separated groups: ${groupNames().join(', ')}
  --only <names>    Comma-separated scenario names or substrings
  --delay <ms>      Pause between publishes   (default: derived from the server rate limit)
  --no-retry        Fail fast on 429 instead of waiting out the limiter
  --dry-run         Print the equivalent curl command instead of publishing
  --list            List the matching scenarios and exit
  -h, --help        Show this help

Exit code is 1 when any scenario's outcome differs from what the route should return.`);
}

function printList(selected: Scenario[]): void {
    let currentGroup = '';

    for (const scenario of selected) {
        if (scenario.group !== currentGroup) {
            currentGroup = scenario.group;

            console.log(`\n${color.bold(currentGroup)}`);
        }

        console.log(
            `  ${color.violet(scenario.name.padEnd(30))} ${color.dim(`[${scenario.expect}]`)} ${
                scenario.description
            }`,
        );
    }

    console.log('');
}

function printResult(result: ScenarioResult): void {
    const badge = result.passed ? color.green('PASS') : color.red('FAIL');
    const outcome = result.passed
        ? result.actual
        : `${result.actual}, expected ${result.scenario.expect}`;

    console.log(
        `${badge} ${result.scenario.name.padEnd(30)} ${color.dim(
            `${result.status} ${outcome}`,
        )} · ${result.detail}`,
    );
}

function printSummary(results: ScenarioResult[]): void {
    const failed = results.filter((result) => !result.passed);

    console.log('');
    console.log(
        `${color.bold('summary')} ${color.green(`${results.length - failed.length} passed`)}${
            failed.length > 0 ? ` · ${color.red(`${failed.length} failed`)}` : ''
        }`,
    );

    if (failed.length > 0) {
        for (const result of failed) {
            console.log(
                `  ${color.red(result.scenario.name)} — ${result.scenario.description} (${result.detail})`,
            );
        }

        process.exit(1);
    }
}

function publishUrl(baseUrl: string, topic: string): string {
    return `${baseUrl}/topic/${encodeURIComponent(topic)}`;
}

async function readPayload(response: Response): Promise<unknown> {
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function runScenario(
    options: RunnerOptions,
    scenario: Scenario,
    request: ScenarioRequest,
): Promise<ScenarioResult> {
    let response = await send(options, request);

    if (response.status === 429 && options.retryOnRateLimit) {
        const waitSeconds = Math.min(
            MAX_RETRY_WAIT_SECONDS,
            Number(response.headers.get('retry-after')) || 60,
        );

        console.log(color.yellow(`  rate limited — waiting ${waitSeconds}s before retrying`));

        await sleep(waitSeconds * 1000);

        response = await send(options, request);
    }

    const payload = await readPayload(response);
    const actual = classify(response.status, payload);

    return {
        actual,
        detail: describePayload(response.status, payload),
        passed: actual === scenario.expect,
        scenario,
        status: response.status,
    };
}

function selectScenarios(options: RunnerOptions): Scenario[] {
    return scenarios.filter((scenario) => {
        const matchesGroup =
            options.groups.length === 0 || options.groups.includes(scenario.group as ScenarioGroup);
        const matchesName =
            options.names.length === 0 ||
            options.names.some((name) => scenario.name.includes(name));

        return matchesGroup && matchesName;
    });
}

function send(options: RunnerOptions, request: ScenarioRequest): Promise<Response> {
    return fetch(publishUrl(options.baseUrl, request.topic), {
        body: request.body,
        headers: { ...request.headers, ...authHeaders(options.token) },
        method: 'POST',
    });
}

function shellQuote(value: string): string {
    return `'${value.replaceAll("'", `'\\''`)}'`;
}

function sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function splitList(value: string): string[] {
    return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
}

function toCurl(options: RunnerOptions, request: ScenarioRequest): string {
    const headers = { ...request.headers, ...authHeaders(options.token) };
    const parts = ['curl -sS -X POST'];

    for (const [key, value] of Object.entries(headers)) {
        parts.push(`  -H ${shellQuote(`${key}: ${value}`)}`);
    }

    parts.push(`  --data ${shellQuote(request.body)}`);
    parts.push(`  ${shellQuote(publishUrl(options.baseUrl, request.topic))}`);

    return parts.join(' \\\n');
}
