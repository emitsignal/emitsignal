import { v } from "convex/values";
import { query } from "../_generated/server";

export const listTopicMessages = query({
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

export const getMessageCountForTopic = query({
    args: {
        topicId: v.id("topics"),
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
            .collect();
        return messages.length;
    },
});

export const getMessageCountsForTopics = query({
    args: {
        topicIds: v.array(v.id("topics")),
    },
    handler: async (ctx, args) => {
        const counts: Record<string, number> = {};
        
        for (const topicId of args.topicIds) {
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_topic", (q) => q.eq("topicId", topicId))
                .collect();
            counts[topicId] = messages.length;
        }
        
        return counts;
    },
});
