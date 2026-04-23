import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Users
    users: defineTable({
        email: v.string(),
        name: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_email", ["email"]),

    // Topics (channels)
    topics: defineTable({
        name: v.string(), // Unique topic identifier
        displayName: v.string(), // Human-readable name
        description: v.optional(v.string()),
        ownerId: v.optional(v.id("users")), // Creator/owner
        isPublic: v.boolean(), // true = public, false = private
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_name", ["name"])
        .index("by_owner", ["ownerId"])
        .index("by_public", ["isPublic"]),

    // Topic access control (for private topics)
    topicAccess: defineTable({
        topicId: v.id("topics"),
        userId: v.id("users"),
        role: v.union(
            v.literal("owner"),
            v.literal("publisher"),
            v.literal("subscriber"),
        ),
        grantedAt: v.number(),
    })
        .index("by_topic", ["topicId"])
        .index("by_user", ["userId"])
        .index("by_topic_user", ["topicId", "userId"]),

    // Messages published to topics
    messages: defineTable({
        topicId: v.id("topics"),
        title: v.string(),
        body: v.string(),
        priority: v.union(
            v.literal(1), // min
            v.literal(2), // low
            v.literal(3), // default
            v.literal(4), // high
            v.literal(5), // max
        ),
        tags: v.array(v.string()),
        senderId: v.optional(v.id("users")), // null = anonymous
        createdAt: v.number(),
    })
        .index("by_topic", ["topicId"])
        .index("by_topic_created", ["topicId", "createdAt"]),

    // Push notification tokens (Expo)
    pushTokens: defineTable({
        userId: v.optional(v.id("users")), // null for anonymous users
        deviceId: v.string(), // Unique device identifier
        token: v.string(), // Expo push token
        platform: v.string(), // ios, android, web
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_device", ["deviceId"])
        .index("by_token", ["token"])
        .index("by_device_user", ["deviceId", "userId"]),

    // User/device subscriptions to topics
    subscriptions: defineTable({
        userId: v.optional(v.id("users")), // null for anonymous users
        deviceId: v.string(), // Unique device identifier
        topicId: v.id("topics"),
        pushEnabled: v.boolean(), // Whether to send push notifications
        createdAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_device", ["deviceId"])
        .index("by_topic", ["topicId"])
        .index("by_device_topic", ["deviceId", "topicId"])
        .index("by_user_topic", ["userId", "topicId"]),
});
