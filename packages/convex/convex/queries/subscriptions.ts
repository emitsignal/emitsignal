import { v } from "convex/values";
import { query } from "../_generated/server";

// Get all subscriptions for a device
export const getDeviceSubscriptions = query({
    args: {
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        const subscriptions = await ctx.db
            .query("subscriptions")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .collect();

        // Get topic details for each subscription
        const subscriptionsWithTopics = await Promise.all(
            subscriptions.map(async (sub) => {
                const topic = await ctx.db.get(sub.topicId);
                return {
                    ...sub,
                    topic,
                };
            }),
        );

        return subscriptionsWithTopics;
    },
});

// Check if a device is subscribed to a specific topic
export const getDeviceSubscriptionStatus = query({
    args: {
        deviceId: v.string(),
        topicName: v.string(),
    },
    handler: async (ctx, args) => {
        const topic = await ctx.db
            .query("topics")
            .withIndex("by_name", (q) => q.eq("name", args.topicName))
            .unique();

        if (!topic) {
            return { subscribed: false, topic: null, subscription: null };
        }

        const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_device_topic", (q) =>
                q.eq("deviceId", args.deviceId).eq("topicId", topic._id),
            )
            .unique();

        return {
            subscribed: !!subscription,
            topic,
            subscription,
        };
    },
});

// Get all subscribers for a topic (for push notifications)
export const getTopicSubscribers = query({
    args: {
        topicId: v.id("topics"),
    },
    handler: async (ctx, args) => {
        const subscriptions = await ctx.db
            .query("subscriptions")
            .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
            .collect();

        // Get push tokens for subscribers with push enabled
        const subscribersWithTokens = await Promise.all(
            subscriptions
                .filter((sub) => sub.pushEnabled)
                .map(async (sub) => {
                    const token = await ctx.db
                        .query("pushTokens")
                        .withIndex("by_device", (q) => q.eq("deviceId", sub.deviceId))
                        .unique();

                    return {
                        deviceId: sub.deviceId,
                        pushToken: token?.token || null,
                    };
                }),
        );

        return subscribersWithTokens.filter((sub) => sub.pushToken);
    },
});

// Get push token for a device
export const getDevicePushToken = query({
    args: {
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        const token = await ctx.db
            .query("pushTokens")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .unique();

        return token;
    },
});
