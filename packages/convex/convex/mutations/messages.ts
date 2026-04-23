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

        // Get all subscribers with push tokens
        const subscriptions = await ctx.db
            .query("subscriptions")
            .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
            .collect();

        // Get push tokens for subscribers
        const tokens: string[] = [];
        for (const sub of subscriptions) {
            if (sub.pushEnabled) {
                const token = await ctx.db
                    .query("pushTokens")
                    .withIndex("by_device", (q) =>
                        q.eq("deviceId", sub.deviceId),
                    )
                    .unique();

                if (token?.token) {
                    tokens.push(token.token);
                }
            }
        }

        // Push notifications are sent via the publishMessageWithNotifications action
        // This mutation returns the tokens so the action can send notifications
        console.log(
            `Message published to ${subscriptions.length} subscribers, ${tokens.length} with push tokens`,
        );

        return messageId;
    },
});
