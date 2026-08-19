// Publishes the demo feed the screenshots show, using nothing but the public
// publish API. The message set is the `showcase` group already catalogued in
// scripts/publish-scenarios.ts, so the store screenshots and the manual publish
// harness stay in sync by construction.

import * as NodeFSP from 'node:fs/promises';
import * as NodePath from 'node:path';
import * as NodeURL from 'node:url';

import type { ScenarioRequest } from '../publish-scenarios.ts';

export interface PublishedMessage {
    readonly messageId: string;
    readonly title: string;
    readonly topic: string;
}

export interface ShowcaseMediaServer {
    readonly origin: string;
    readonly port: number;
    stop: () => void;
}

const SCRIPT_DIRECTORY = NodePath.dirname(NodeURL.fileURLToPath(import.meta.url));
const MEDIA_DIRECTORY = NodePath.resolve(
    SCRIPT_DIRECTORY,
    '../../packages/emitsignal-website/public/static/showcase',
);

export const SHOWCASE_MEDIA_PORT = 8198;

// Anonymous publishing is capped at 10/min server-side. Pace just under that;
// a 429 still gets one Retry-After honoured below.
const PUBLISH_INTERVAL_MS = 6_500;
const MAXIMUM_RETRY_WAIT_MS = 90_000;

export function findShowcaseMessage(
    published: ReadonlyArray<PublishedMessage>,
    title: string,
): PublishedMessage {
    const match = published.find((message) => message.title === title);
    if (!match) {
        throw new Error(
            `No published showcase message is titled '${title}'. Published: ${published
                .map((message) => message.title)
                .join(', ')}`,
        );
    }
    return match;
}

export async function publishShowcaseContent(
    apiUrl: string,
    log: (line: string) => void,
): Promise<ReadonlyArray<PublishedMessage>> {
    // publish-scenarios.ts resolves its media base at import time, so the media
    // server has to be running and EMITSIGNAL_MEDIA_BASE already set before this
    // module is pulled in. Hence the dynamic import.
    const { scenarios } = await import('../publish-scenarios.ts');
    const showcaseScenarios = scenarios.filter((scenario) => scenario.group === 'showcase');
    if (showcaseScenarios.length === 0) {
        throw new Error('No showcase scenarios are defined in scripts/publish-scenarios.ts.');
    }

    const published: PublishedMessage[] = [];
    for (const [index, scenario] of showcaseScenarios.entries()) {
        if (index > 0) await delay(PUBLISH_INTERVAL_MS);

        const request = scenario.build({ now: Date.now(), topic: scenario.name });
        const messageId = await publishOnce(apiUrl, request);
        const title = titleOf(request);
        published.push({ messageId, title, topic: request.topic });
        log(
            `  ${String(index + 1).padStart(2)}/${showcaseScenarios.length} ${request.topic} — ${title}`,
        );
    }
    return published;
}

/**
 * Serves the website's showcase media to the simulator. The assets are not
 * deployed, so pointing publish-scenarios.ts at production yields messages whose
 * banner images 404 — which is what left the message-detail chart blank before.
 * Stays up for the whole run: the app fetches these while each scene renders.
 */
export async function startShowcaseMediaServer(
    warn: (line: string) => void,
): Promise<ShowcaseMediaServer> {
    const available = new Set(await NodeFSP.readdir(MEDIA_DIRECTORY).catch(() => [] as string[]));
    const missing = new Set<string>();
    const server = Bun.serve({
        fetch: (request) => {
            const name = NodePath.basename(new URL(request.url).pathname);
            if (!available.has(name)) {
                missing.add(name);
                return new Response('Not found', { status: 404 });
            }
            return new Response(Bun.file(NodePath.join(MEDIA_DIRECTORY, name)));
        },
        port: SHOWCASE_MEDIA_PORT,
    });
    const origin = `http://127.0.0.1:${SHOWCASE_MEDIA_PORT}`;
    process.env.EMITSIGNAL_MEDIA_BASE = origin;
    return {
        origin,
        port: SHOWCASE_MEDIA_PORT,
        stop: () => {
            if (missing.size > 0) {
                warn(
                    `Missing showcase media (those cards render without an image): ${[...missing].sort().join(', ')}`,
                );
            }
            server.stop(true);
        },
    };
}

/**
 * Subscribes the anonymous device over the public API, which is all the sheet in
 * app/modal.tsx does. Leaving listenSince at its default means the device only
 * ever sees messages published after this call, so a topic that has accumulated
 * demo feeds from earlier runs still yields exactly one clean feed.
 */
export async function subscribeDevice(
    apiUrl: string,
    deviceId: string,
    topicName: string,
): Promise<void> {
    const response = await fetch(`${apiUrl}/subscriptions`, {
        body: JSON.stringify({
            deviceId,
            pushEnabled: true,
            topicName,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error(
            `Subscribing ${deviceId} to ${topicName} failed (HTTP ${response.status}): ${await response.text()}`,
        );
    }
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function publishOnce(apiUrl: string, request: ScenarioRequest): Promise<string> {
    const response = await send(apiUrl, request);

    if (response.status === 429) {
        const waitMs = Math.min(
            (Number(response.headers.get('retry-after') ?? 10) || 10) * 1_000,
            MAXIMUM_RETRY_WAIT_MS,
        );
        await delay(waitMs);
        return await readMessageId(await send(apiUrl, request), request);
    }

    return await readMessageId(response, request);
}

async function readMessageId(response: Response, request: ScenarioRequest): Promise<string> {
    const payload: unknown = await response.json().catch(() => null);

    // Publish reports some failures as HTTP 200 with an `error` field, so the
    // status alone cannot tell a success from a rejection.
    if (
        !response.ok ||
        typeof payload !== 'object' ||
        payload === null ||
        !('messageId' in payload) ||
        typeof payload.messageId !== 'string'
    ) {
        throw new Error(
            `Publishing to ${request.topic} failed (HTTP ${response.status}): ${JSON.stringify(payload)}`,
        );
    }

    return payload.messageId;
}

function send(apiUrl: string, request: ScenarioRequest): Promise<Response> {
    return fetch(`${apiUrl}/publish/${request.topic}`, {
        body: request.body,
        headers: request.headers,
        method: 'POST',
    });
}

function titleOf(request: ScenarioRequest): string {
    try {
        const payload: unknown = JSON.parse(request.body);
        if (typeof payload === 'object' && payload !== null && 'title' in payload) {
            return String(payload.title);
        }
    } catch {
        // Header-format requests carry no JSON body; fall back to the topic.
    }
    return request.topic;
}
