import { v } from "convex/values";
import { query } from "../_generated/server";

export const list = query({
    args: {
        isPublic: v.optional(v.boolean()),
        limit: v.optional(v.number()),
        cursor: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let queryBuilder = ctx.db.query("topics");

        if (args.isPublic !== undefined) {
            const isPublicValue = args.isPublic ?? true;
            queryBuilder = queryBuilder.withIndex("by_public", (q) =>
                q.eq("isPublic", isPublicValue),
            );
        }

        const topics = await queryBuilder.order("desc").take(args.limit ?? 50);

        return topics;
    },
});

export const getByName = query({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("topics")
            .withIndex("by_name", (q) => q.eq("name", args.name))
            .first();
    },
});

export const getById = query({
    args: {
        id: v.id("topics"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getMessages = query({
    args: {
        topicId: v.id("topics"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_topic_created", (q) => q.eq("topicId", args.topicId))
            .order("desc")
            .take(args.limit ?? 50);
    },
});
