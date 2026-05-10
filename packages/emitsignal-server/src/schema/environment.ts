import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const environmentSchema = Type.Object({
    EMIT_SIGNAL_HTTP_PORT: Type.Number({ default: 3333 }),
});

export const environment = Value.Parse(environmentSchema, Bun.env);
