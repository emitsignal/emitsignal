import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Subscribe a device to a topic (auto-creates topic if not exists)
export const subscribeToTopic = mutation({
    args: {
        topicName: v.string(),
        deviceId: v.string(),
        pushToken: v.optional(v.string()),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        // Find or create topic
        let topic = await ctx.db
            .query("topics")
            .withIndex("by_name", (q) => q.eq("name", args.topicName))
            .unique();

        if (!topic) {
            // Auto-create the topic
            const now = Date.now();
            topic = await ctx.db.insert("topics", {
                name: args.topicName,
                displayName: args.topicName,
                description: undefined,
                ownerId: args.userId, // Owner is user if authenticated, null otherwise
                isPublic: true, // Auto-created topics are public by default
                createdAt: now,
                updatedAt: now,
            });
            // Get the inserted topic
            topic = await ctx.db
                .query("topics")
                .withIndex("by_name", (q) => q.eq("name", args.topicName))
                .unique();
        }

        if (!topic) {
            throw new Error("Failed to create or find topic");
        }

        // Check if already subscribed
        const existingSubscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_device_topic", (q) =>
                q.eq("deviceId", args.deviceId).eq("topicId", topic!._id),
            )
            .unique();

        if (existingSubscription) {
            // Already subscribed, update push token if provided
            if (args.pushToken) {
                await ctx.db.patch(existingSubscription._id, {
                    pushEnabled: true,
                });
            }
            return {
                topic,
                subscription: existingSubscription,
                created: false,
            };
        }

        // Create subscription
        const now = Date.now();
        const subscriptionId = await ctx.db.insert("subscriptions", {
            userId: args.userId,
            deviceId: args.deviceId,
            topicId: topic._id,
            pushEnabled: true,
            createdAt: now,
        });

        const subscription = await ctx.db.get(subscriptionId);

        // Register push token if provided
        if (args.pushToken) {
            await registerPushTokenInternal(ctx, {
                deviceId: args.deviceId,
                token: args.pushToken,
                userId: args.userId,
            });
        }

        return { topic, subscription, created: true };
    },
});

// Unsubscribe a device from a topic
export const unsubscribeFromTopic = mutation({
    args: {
        topicId: v.id("topics"),
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_device_topic", (q) =>
                q.eq("deviceId", args.deviceId).eq("topicId", args.topicId),
            )
            .unique();

        if (subscription) {
            await ctx.db.delete(subscription._id);
        }

        // Check if this device has any other subscriptions
        const otherSubscriptions = await ctx.db
            .query("subscriptions")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .take(1);

        // If no more subscriptions, optionally remove push token
        // For now, we'll keep it in case they subscribe to something else

        return { success: true, wasSubscribed: !!subscription };
    },
});

// Register/update push token for a device
export const registerPushToken = mutation({
    args: {
        deviceId: v.string(),
        token: v.string(),
        platform: v.string(),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        return await registerPushTokenInternal(ctx, args);
    },
});

// Internal helper function
async function registerPushTokenInternal(
    ctx: any,
    args: {
        deviceId: string;
        token: string;
        platform?: string;
        userId?: string;
    },
) {
    // Check for existing token
    const existingToken = await ctx.db
        .query("pushTokens")
        .withIndex("by_token", (q) => q.eq("token", args.token))
        .unique();

    const now = Date.now();

    if (existingToken) {
        // Update existing token
        await ctx.db.patch(existingToken._id, {
            userId: args.userId,
            updatedAt: now,
        });
        return { token: existingToken, updated: true };
    }

    // Check for existing token for this device
    const existingDeviceToken = await ctx.db
        .query("pushTokens")
        .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
        .unique();

    if (existingDeviceToken) {
        // Update with new token
        await ctx.db.patch(existingDeviceToken._id, {
            token: args.token,
            platform: args.platform || existingDeviceToken.platform,
            userId: args.userId,
            updatedAt: now,
        });
        return {
            token: { ...existingDeviceToken, token: args.token },
            updated: true,
        };
    }

    // Create new token
    const tokenId = await ctx.db.insert("pushTokens", {
        userId: args.userId,
        deviceId: args.deviceId,
        token: args.token,
        platform: args.platform || "unknown",
        createdAt: now,
        updatedAt: now,
    });

    const token = await ctx.db.get(tokenId);
    return { token, updated: false };
}

// Remove push token for a device
export const removePushToken = mutation({
    args: {
        deviceId: v.string(),
    },
    handler: async (ctx, args) => {
        const existingToken = await ctx.db
            .query("pushTokens")
            .withIndex("by_device", (q) => q.eq("deviceId", args.deviceId))
            .unique();

        if (existingToken) {
            await ctx.db.delete(existingToken._id);
            return { removed: true };
        }

        return { removed: false };
    },
});
