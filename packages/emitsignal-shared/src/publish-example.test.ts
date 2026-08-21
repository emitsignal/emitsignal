import { describe, expect, test } from 'bun:test';

import { buildCliExample, buildCurlExample } from './publish-example.ts';

const BASE_URL = 'https://emitsignal.com';

describe('buildCurlExample · json', () => {
    test('builds a JSON publish command', () => {
        expect(
            buildCurlExample({
                baseUrl: BASE_URL,
                message: { body: 'shipped v2', priority: 4, tags: ['deploy'], title: 'Deploy' },
                topicName: 'deploy/prod',
            }),
        ).toBe(
            `curl -X POST https://emitsignal.com/publish/deploy/prod \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Deploy","body":"shipped v2","priority":4,"tags":["deploy"]}'`,
        );
    });

    test('adds an Authorization header when an API key is given', () => {
        expect(
            buildCurlExample({
                apiKey: 'es_secret',
                baseUrl: BASE_URL,
                message: { body: 'hello' },
                topicName: 'alerts',
            }),
        ).toBe(
            `curl -X POST https://emitsignal.com/publish/alerts \\
  -H "Authorization: Bearer es_secret" \\
  -H "Content-Type: application/json" \\
  -d '{"body":"hello"}'`,
        );
    });

    test('omits empty fields from the payload', () => {
        expect(
            buildCurlExample({
                baseUrl: BASE_URL,
                message: { actions: [], body: 'hello', tags: [] },
                topicName: 'alerts',
            }),
        ).toContain(`-d '{"body":"hello"}'`);
    });

    test('includes actions when present', () => {
        expect(
            buildCurlExample({
                baseUrl: BASE_URL,
                message: { actions: [{ type: 'acknowledge' }], body: 'hello' },
                topicName: 'alerts',
            }),
        ).toContain(`"actions":[{"type":"acknowledge"}]`);
    });

    test('drops the body flags when the message is empty', () => {
        expect(buildCurlExample({ baseUrl: BASE_URL, topicName: 'alerts' })).toBe(
            'curl -X POST https://emitsignal.com/publish/alerts',
        );
    });

    test('keeps a body containing a single quote pasteable', () => {
        const command = buildCurlExample({
            baseUrl: BASE_URL,
            message: { body: "deploy didn't finish" },
            topicName: 'alerts',
        });

        expect(command).toContain(`-d '{"body":"deploy didn'\\''t finish"}'`);
    });
});

describe('buildCurlExample · headers', () => {
    test('builds a single-line command when only a body is given', () => {
        expect(
            buildCurlExample({
                baseUrl: BASE_URL,
                message: { body: 'hello' },
                style: 'headers',
                topicName: 'alerts/prod',
            }),
        ).toBe('curl -d "hello" https://emitsignal.com/publish/alerts/prod');
    });

    test('emits title, priority and tag headers with the url last', () => {
        expect(
            buildCurlExample({
                apiKey: 'es_secret',
                baseUrl: BASE_URL,
                message: { body: 'hello', priority: 5, tags: ['deploy', 'prod'], title: 'Hello' },
                style: 'headers',
                topicName: 'alerts',
            }),
        ).toBe(
            `curl -d "hello" \\
  -H "Authorization: Bearer es_secret" \\
  -H "title: Hello" \\
  -H "x-priority: 5" \\
  -H "x-tags: deploy,prod" \\
  https://emitsignal.com/publish/alerts`,
        );
    });

    test('escapes double quotes in the body', () => {
        expect(
            buildCurlExample({
                baseUrl: BASE_URL,
                message: { body: 'say "hi"' },
                style: 'headers',
                topicName: 'alerts',
            }),
        ).toContain('curl -d "say \\"hi\\""');
    });
});

describe('buildCliExample', () => {
    test('publishes a body with no flags at the default priority', () => {
        expect(
            buildCliExample({ message: { body: 'deploy ok', priority: 3 }, topicName: 'alerts' }),
        ).toBe('emitsignal publish alerts "deploy ok"');
    });

    test('adds priority, title and tag flags', () => {
        expect(
            buildCliExample({
                message: {
                    body: 'shipped v2',
                    priority: 4,
                    tags: ['deploy', 'prod'],
                    title: 'Deploy',
                },
                topicName: 'deploy/prod',
            }),
        ).toBe('emitsignal publish deploy/prod "shipped v2" -p4 -T "Deploy" -t "deploy,prod"');
    });

    test('skips the title flag when it repeats the body', () => {
        expect(
            buildCliExample({ message: { body: 'hello', title: 'hello' }, topicName: 'a' }),
        ).toBe('emitsignal publish a "hello"');
    });
});
