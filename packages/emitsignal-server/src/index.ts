import { fromTypes, openapi } from "@elysia/openapi";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { magicLink } from "./http/auth/magic-link";
import { me } from "./http/auth/me";
import { verify } from "./http/auth/verify";
import { registerPushToken } from "./http/push-tokens/register";
import { listSubscriptions } from "./http/subscriptions/list";
import { subscribe } from "./http/subscriptions/subscribe";
import { unsubscribe } from "./http/subscriptions/unsubscribe";
import { getTopic } from "./http/topic/get";
import { listTopics } from "./http/topic/list";
import { listen } from "./http/topic/listen";
import { listenMulti } from "./http/topic/listen-multi";
import { messages } from "./http/topic/messages";
import { publish } from "./http/topic/publish";
import { environment } from "./schema/environment";

const app = new Elysia()
    .onError(({ code, error }) => {
        console.error(code, error);
    })
    .use(
        openapi({
            references: fromTypes(),
        }),
    )
    .use(cors({ allowedHeaders: "*" }))
    .get("/", () => ({ name: "emitsignal", version: "0.1.0" }))
    .use(magicLink)
    .use(verify)
    .use(me)
    .use(listTopics)
    .use(getTopic)
    .use(publish)
    .use(messages)
    .use(listen)
    .use(listenMulti)
    .use(listSubscriptions)
    .use(subscribe)
    .use(unsubscribe)
    .use(registerPushToken)
    .listen(environment.EMIT_SIGNAL_HTTP_PORT);

console.log(`🟣 @EmitSignal running at ${app.server?.hostname}:${app.server?.port}`);
