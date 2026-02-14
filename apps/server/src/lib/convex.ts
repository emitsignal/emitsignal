import { ConvexHttpClient } from "convex/browser";
import { api } from "@notify/convex";

const convexUrl = process.env.CONVEX_URL;

if (!convexUrl) {
    throw new Error("CONVEX_URL environment variable is not set");
}

export const convex = new ConvexHttpClient(convexUrl);

export { api };
