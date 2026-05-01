import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { auth } from "./http/auth";
import { pushTokens } from "./http/push-tokens";
import { subscriptions } from "./http/subscriptions";
import { listMessages } from "./http/topic/list-messages";
import { listTopics } from "./http/topic/list-topics";
import { publishMessage } from "./http/topic/publish-message";
import { sseListen } from "./http/topic/sse";

const app = new Elysia()
    .onError(({ code, error }) => {
        console.error(code, error);
    })
    .use(cors({ allowedHeaders: "*" }))
    .get("/", () => ({ name: "whinsper", version: "0.1.0" }))
    .use(auth)
    .use(publishMessage)
    .use(listTopics)
    .use(listMessages)
    .use(sseListen)
    .use(subscriptions)
    .use(pushTokens)
    .listen(3000);

console.log(
    `🟣 Whinsper running at ${app.server?.hostname}:${app.server?.port}`,
);
