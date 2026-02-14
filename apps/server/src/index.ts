import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { postTopic } from "./http/topic/post-topic";

const app = new Elysia()
    .onError(({ code, error }) => console.log(code, error))
    .use(cors({ allowedHeaders: "*" }))
    .get("/", () => "Hello Elysia")
    .use(postTopic)
    .listen(3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
