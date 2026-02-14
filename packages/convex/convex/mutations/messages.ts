import { v } from "convex/values";
import { mutation } from "../_generated/server.js";

export const publishMessage = mutation({
    args: {
        topicId: v.id("topics"),
        title: v.string(),
        body: v.string(),
        priority: v.optional(
            v.union(
                v.literal(1),
                v.literal(2),
                v.literal(3),
                v.literal(4),
                v.literal(5),
            ),
        ),
        tags: v.optional(v.array(v.string())),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const { userId } = args;
        const now = Date.now();

        // Get topic to check permissions
        const topic = await ctx.db.get(args.topicId);
        if (!topic) {
            throw new Error("Topic not found");
        }

        // Check if user can publish to this topic
        if (!topic.isPublic && userId) {
            const access = await ctx.db
                .query("topicAccess")
                .withIndex("by_topic_user", (q) =>
                    q.eq("topicId", args.topicId).eq("userId", userId),
                )
                .first();

            const canPublish =
                access &&
                (access.role === "owner" || access.role === "publisher");
            if (!canPublish) {
                throw new Error("Not authorized to publish to this topic");
            }
        }

        const messageId = await ctx.db.insert("messages", {
            topicId: args.topicId,
            title: args.title,
            body: args.body,
            priority: args.priority ?? 3,
            tags: args.tags ?? [],
            senderId: userId,
            createdAt: now,
        });

        // TODO: Trigger push notifications to subscribers

        return messageId;
    },
});
