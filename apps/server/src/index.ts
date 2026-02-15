import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { publishMessage } from "./http/topic/publish-message";

const app = new Elysia()
    .onError(({ code, error }) => console.log(code, error))
    .use(cors({ allowedHeaders: "*" }))
    .get("/", () => "Hello Elysia")
    .use(publishMessage)
    .listen(3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
