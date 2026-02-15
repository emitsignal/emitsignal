import { v } from "convex/values";
import { mutation } from "../_generated/server.js";

export const createTopic = mutation({
    args: {
        name: v.string(),
        displayName: v.string(),
        description: v.optional(v.string()),
        isPublic: v.boolean(),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const { userId } = args;
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Check if topic name already exists
        const existing = await ctx.db
            .query("topics")
            .withIndex("by_name", (q) => q.eq("name", args.name))
            .first();

        if (existing) {
            throw new Error("Topic already exists");
        }

        const now = Date.now();

        const topic = {
            name: args.name,
            displayName: args.displayName,
            description: args.description,
            ownerId: userId,
            isPublic: args.isPublic,
            createdAt: now,
            updatedAt: now,
        };

        const topicId = await ctx.db.insert("topics", topic);

        // Grant owner access
        await ctx.db.insert("topicAccess", {
            topicId,
            userId,
            role: "owner",
            grantedAt: now,
        });

        return { ...topic, _id: topicId };
    },
});
