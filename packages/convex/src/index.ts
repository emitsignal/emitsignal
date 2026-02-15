// Client-side exports for @notify/convex
// Re-export generated types and utilities for apps to use

export type { Doc, Id, DataModel } from "../convex/_generated/dataModel";

export type {
    MutationCtx,
    QueryCtx,
    ActionCtx,
} from "../convex/_generated/server";

// Re-export schema for type-safe table names
export { default as schema } from "../convex/schema";

// Re-export API
export { api } from "../convex/_generated/api";
